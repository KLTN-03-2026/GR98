import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera, Upload, Leaf, AlertTriangle, CheckCircle,
  XCircle, Loader2, RotateCcw, HelpCircle, X, FlipHorizontal, MapPin, ScanSearch,
  PlayCircle, StopCircle,
} from 'lucide-react';
import { analyzeLeafImage, type AIVisionResult } from '../services/aiVision';
import { saveScanResult, mapAIResultToPayload } from '../services/plantScan';
import { fetchMyPlots, formatCropType, type PlotItem } from '../services/plots';
import {
  getActiveSession,
  createSession,
  closeSession,
  cancelSession,
  type ScanSession,
} from '../services/scanSession';
import {
  requestRecommendation,
  approveRecommendation,
  rejectRecommendation,
  type TreatmentRecommendation,
} from '../services/aiAdvisor';
import PwaPageHeader from '../components/PwaPageHeader';
import PwaTabMenu from '../components/PwaTabMenu';


type InputMode = 'upload' | 'camera';

export default function AIVisionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<AIVisionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Lô đất
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');

  // Phiên quét đa điểm cho lô đang chọn (nếu có).
  // Khi plot đổi → check xem có phiên OPEN sẵn không. Nếu có → load lại.
  const [activeSession, setActiveSession] = useState<ScanSession | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [closedSummary, setClosedSummary] = useState<ScanSession | null>(null);

  // Khuyến nghị xử lý từ AI Advisor (Claude + RAG). Sinh sau khi đóng phiên.
  const [recommendation, setRecommendation] = useState<TreatmentRecommendation | null>(null);
  const [advisorBusy, setAdvisorBusy] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load danh sách lô đất
  useEffect(() => {
    fetchMyPlots().then(setPlots);
  }, []);

  // Khi đổi plot → kiểm tra plot này có phiên quét OPEN nào không.
  // Nếu có → load lại để supervisor tiếp tục phiên cũ thay vì tạo mới.
  useEffect(() => {
    if (!selectedPlotId) {
      setActiveSession(null);
      setClosedSummary(null);
      return;
    }
    let cancelled = false;
    getActiveSession(selectedPlotId)
      .then((s) => {
        if (!cancelled) setActiveSession(s);
      })
      .catch(() => {
        if (!cancelled) setActiveSession(null);
      });
    setClosedSummary(null);
    return () => {
      cancelled = true;
    };
  }, [selectedPlotId]);

  const handleStartSession = async () => {
    if (!selectedPlotId) return;
    setSessionBusy(true);
    try {
      const session = await createSession(selectedPlotId);
      setActiveSession(session);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không tạo được phiên quét');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setSessionBusy(true);
    try {
      const closed = await closeSession(activeSession.id);
      setActiveSession(null);
      setClosedSummary(closed);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không đóng được phiên');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    if (!window.confirm('Huỷ phiên quét hiện tại? Các ảnh đã quét vẫn được lưu vào lịch sử nhưng phiên sẽ không tính khuyến nghị.')) return;
    setSessionBusy(true);
    try {
      await cancelSession(activeSession.id);
      setActiveSession(null);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không huỷ được phiên');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleRequestRecommendation = async () => {
    if (!closedSummary) return;
    setAdvisorBusy(true);
    setShowCitations(false);
    try {
      const reco = await requestRecommendation(closedSummary.id);
      setRecommendation(reco);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không lấy được khuyến nghị');
    } finally {
      setAdvisorBusy(false);
    }
  };

  const handleApproveRecommendation = async () => {
    if (!recommendation) return;
    setAdvisorBusy(true);
    try {
      const updated = await approveRecommendation(recommendation.id);
      setRecommendation(updated);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không duyệt được');
    } finally {
      setAdvisorBusy(false);
    }
  };

  const handleRejectRecommendation = async () => {
    if (!recommendation) return;
    const note = window.prompt('Lý do từ chối (tuỳ chọn)') ?? undefined;
    setAdvisorBusy(true);
    try {
      const updated = await rejectRecommendation(recommendation.id, note);
      setRecommendation(updated);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không từ chối được');
    } finally {
      setAdvisorBusy(false);
    }
  };

  // Check browser support for camera
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Start camera with proper permission handling
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      // Check if mediaDevices is supported
      if (!isCameraSupported()) {
        setCameraError('Trình duyệt không hỗ trợ camera. Vui lòng sử dụng Chrome, Firefox, hoặc Edge.');
        return;
      }

      // Request camera with specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current && mediaStream.active) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);

    } catch (err) {
      console.error('Camera error:', err);
      const errorName = err instanceof DOMException ? err.name : '';

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setCameraError('Quyền camera bị từ chối. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy camera. Vui lòng kết nối webcam vào máy tính.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setCameraError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng khác đang dùng camera.');
      } else if (errorName === 'OverconstrainedError') {
        setCameraError('Camera không hỗ trợ độ phân giải yêu cầu. Đang thử lại...');
        // Retry with lower resolution
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: facingMode === 'environment' ? { facingMode: 'user' } : true,
            audio: false
          });
          streamRef.current = fallbackStream;
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
          return;
        } catch {
          setCameraError('Camera không tương thích. Vui lòng sử dụng tab Upload để tải ảnh lên.');
        }
      } else {
        setCameraError('Không thể truy cập camera. Vui lòng sử dụng tab Upload để tải ảnh.');
      }
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    setCameraError(null);
  }, []);

  // Toggle camera mode
  const handleToggleMode = (mode: InputMode) => {
    if (mode === inputMode) return;

    if (inputMode === 'camera') {
      stopCamera();
    }
    setInputMode(mode);
    setError(null);
    setCameraError(null);
  };

  // Start camera when entering camera mode
  useEffect(() => {
    if (inputMode === 'camera') {
      startCamera();
    }
  }, [inputMode, startCamera]);

  // Cleanup on mode change
  useEffect(() => {
    if (inputMode !== 'camera') {
      stopCamera();
    }
  }, [inputMode, stopCamera]);

  // Toggle front/back camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    if (inputMode === 'camera' && streamRef.current) {
      startCamera();
    }
  }, [facingMode, inputMode, startCamera]);

  // Capture photo from camera
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      stopCamera();
      setInputMode('upload');
    }, 'image/jpeg', 0.9);
  };

  const processImageFile = useCallback((file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước file quá lớn (tối đa 10MB)');
      return;
    }

    setImageFile(file);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  }, [processImageFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  }, [processImageFile]);

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Lấy cropType của plot đang chọn để BE biết load model nào (durian/coffee)
      const plot = plots.find((p) => p.id === selectedPlotId);
      const cropType = plot?.cropType || 'ca-phe';
      const data = await analyzeLeafImage(imageFile, cropType);
      setResult(data);

      // Auto-save kết quả lên server (fire-and-forget, không block UI).
      // Nếu đang trong phiên quét đa điểm → gắn sessionId để cuối phiên
      // tổng hợp tỉ lệ cây nhiễm cho cấp lô.
      void saveScanResult(mapAIResultToPayload(data, {
        plotId: selectedPlotId || undefined,
        sessionId: activeSession?.id,
      }));

      // Optimistic update đếm ảnh trong phiên (không đợi BE).
      if (activeSession) {
        const infected = data.benh.phan_loai?.toLowerCase() !== 'healthy';
        setActiveSession({
          ...activeSession,
          _count: { scans: (activeSession._count?.scans ?? 0) + 1 },
          totalScans: activeSession.totalScans + 1,
          infectedCount: activeSession.infectedCount + (infected ? 1 : 0),
        });
      }
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Không thể phân tích hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setSelectedPlotId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const getDangerLevel = (level: string) => {
    if (!level) return { color: 'text-gray-600', bg: 'bg-gray-100', icon: HelpCircle };
    const lower = level.toLowerCase();
    if (lower.includes('cao') || lower.includes('high')) return { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
    if (lower.includes('trung bình') || lower.includes('medium')) return { color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle };
    return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
  };

  const dangerInfo = result ? getDangerLevel(result.benh?.do_nguy_hiem) : null;

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-24">
      <canvas ref={canvasRef} className="hidden" />

      <PwaPageHeader
        title="Quét bệnh cây"
        subtitle="Nhận diện qua ảnh lá"
        icon={ScanSearch}
        actions={
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleToggleMode('upload')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${inputMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Upload
            </button>
            <button
              onClick={() => handleToggleMode('camera')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${inputMode === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Camera
            </button>
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* ═══════════════════════════════════════════════════════════════
            BLOCK A — Chọn lô đất + quản lý phiên quét đa điểm.
            Luôn hiển thị ở đầu (kể cả khi chưa upload ảnh) để supervisor
            có thể bắt đầu phiên trước, rồi mới quét lần lượt từng cây.
            Trạng thái:
              · Chưa chọn plot → chỉ hiện dropdown
              · Đã chọn + chưa có phiên + chưa có summary → nút "Bắt đầu phiên"
              · Đang có phiên OPEN → box xanh + nút Kết thúc/Huỷ
              · Vừa đóng phiên → summary card + nút "Lấy khuyến nghị AI"
              · Có recommendation → render card khuyến nghị bên dưới
            ═══════════════════════════════════════════════════════════ */}
        <div className={`bg-white border rounded-2xl p-4 space-y-2 transition ${
          selectedPlotId ? 'border-green-300' : 'border-orange-300'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className={`w-4 h-4 ${selectedPlotId ? 'text-green-600' : 'text-orange-500'}`} />
            <span>Lô đất đang chụp</span>
            <span className={`ml-auto text-xs font-semibold ${
              selectedPlotId ? 'text-green-600' : 'text-orange-500'
            }`}>
              {selectedPlotId ? '✓ Đã chọn' : '* Bắt buộc'}
            </span>
          </div>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition bg-gray-50 ${
              selectedPlotId
                ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                : 'border-orange-200 focus:ring-orange-200 focus:border-orange-400'
            }`}
          >
            <option value="">— Chọn lô đất —</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                [{plot.lotCode}] {plot.farmerName} — {formatCropType(plot.cropType)}
                {plot.district && plot.province ? ` (${plot.district}, ${plot.province})` : ''}
              </option>
            ))}
          </select>
          {plots.length === 0 && (
            <p className="text-xs text-gray-400">Không tải được danh sách lô đất.</p>
          )}
          {!selectedPlotId && plots.length > 0 && (
            <p className="text-xs text-orange-500">Vui lòng chọn lô đất trước khi phân tích.</p>
          )}

          {selectedPlotId && !activeSession && !closedSummary && (
            <button
              type="button"
              onClick={handleStartSession}
              disabled={sessionBusy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition"
            >
              <PlayCircle className="h-4 w-4" />
              {sessionBusy ? 'Đang tạo phiên...' : 'Bắt đầu phiên quét đa điểm'}
            </button>
          )}

          {selectedPlotId && activeSession && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <ScanSearch className="h-4 w-4" />
                  Phiên quét đang mở
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {activeSession._count?.scans ?? activeSession.totalScans ?? 0} ảnh
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 leading-relaxed">
                Tiếp tục chụp các cây trong lô. Sau khi quét đủ, bấm
                "Kết thúc phiên" để hệ thống tính mức độ lan rộng + đề
                xuất khuyến nghị xử lý.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={sessionBusy}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold py-2 hover:bg-emerald-700 disabled:opacity-50"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  Kết thúc phiên
                </button>
                <button
                  type="button"
                  onClick={handleCancelSession}
                  disabled={sessionBusy}
                  className="rounded-lg border border-rose-300 bg-white text-rose-600 text-xs font-semibold py-2 hover:bg-rose-50 disabled:opacity-50"
                >
                  Huỷ phiên
                </button>
              </div>
            </div>
          )}

          {closedSummary && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-900">Phiên đã đóng</p>
                <button
                  type="button"
                  onClick={() => {
                    setClosedSummary(null);
                    setRecommendation(null);
                    setShowCitations(false);
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Bắt đầu phiên mới
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white rounded-md p-2">
                  <p className="text-indigo-500 text-[10px] uppercase font-bold">Tổng</p>
                  <p className="text-base font-bold text-indigo-900">{closedSummary.totalScans}</p>
                </div>
                <div className="bg-white rounded-md p-2">
                  <p className="text-indigo-500 text-[10px] uppercase font-bold">Nhiễm</p>
                  <p className="text-base font-bold text-rose-600">{closedSummary.infectedCount}</p>
                </div>
                <div className="bg-white rounded-md p-2">
                  <p className="text-indigo-500 text-[10px] uppercase font-bold">Mức độ</p>
                  <p className="text-base font-bold text-indigo-900 capitalize">
                    {closedSummary.severity === 'severe' && 'Nặng'}
                    {closedSummary.severity === 'medium' && 'Trung bình'}
                    {closedSummary.severity === 'light' && 'Nhẹ'}
                    {closedSummary.severity === 'none' && 'Không'}
                  </p>
                </div>
              </div>
              {!recommendation && (
                <button
                  type="button"
                  onClick={handleRequestRecommendation}
                  disabled={advisorBusy}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {advisorBusy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang phân tích từ tài liệu BVTV...
                    </>
                  ) : (
                    <>
                      <ScanSearch className="h-3.5 w-3.5" />
                      Lấy khuyến nghị xử lý từ AI
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {recommendation && (
            <div className={`rounded-xl border p-3 space-y-3 ${
              recommendation.status === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-200'
                : recommendation.status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-white border-indigo-300'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">🌾 Khuyến nghị xử lý từ AI</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Độ tin cậy:{' '}
                    <span className={`font-semibold ${
                      recommendation.confidence === 'high' ? 'text-emerald-600' :
                      recommendation.confidence === 'medium' ? 'text-amber-600' :
                      'text-rose-600'
                    }`}>
                      {recommendation.confidence === 'high' && 'Cao'}
                      {recommendation.confidence === 'medium' && 'Trung bình'}
                      {recommendation.confidence === 'low' && 'Thấp'}
                    </span>
                    {recommendation.status !== 'DRAFT' && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        recommendation.status === 'APPROVED'
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-rose-200 text-rose-800'
                      }`}>
                        {recommendation.status === 'APPROVED' ? '✓ Đã duyệt' : '✗ Đã từ chối'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-800 leading-relaxed">
                {recommendation.payload.diagnosisSummary}
              </p>

              {recommendation.payload.recommendation.product && (
                <div className="bg-white rounded-lg border border-gray-100 p-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Thuốc</span><span className="font-semibold text-gray-900">{recommendation.payload.recommendation.product}</span></div>
                  {recommendation.payload.recommendation.dosagePerHa && <div className="flex justify-between"><span className="text-gray-500">Liều/ha</span><span className="font-semibold text-gray-900">{recommendation.payload.recommendation.dosagePerHa}</span></div>}
                  {recommendation.payload.recommendation.totalDosage && <div className="flex justify-between"><span className="text-gray-500">Tổng liều</span><span className="font-bold text-indigo-600">{recommendation.payload.recommendation.totalDosage}</span></div>}
                  {recommendation.payload.recommendation.sprayInterval && <div className="flex justify-between"><span className="text-gray-500">Chu kỳ phun</span><span className="font-semibold text-gray-900">{recommendation.payload.recommendation.sprayInterval}</span></div>}
                  {recommendation.payload.recommendation.duration && <div className="flex justify-between"><span className="text-gray-500">Số lần phun</span><span className="font-semibold text-gray-900">{recommendation.payload.recommendation.duration}</span></div>}
                </div>
              )}

              {recommendation.payload.warnings && recommendation.payload.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
                  {recommendation.payload.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /><span>{w}</span></p>
                  ))}
                </div>
              )}

              {recommendation.payload.citations && recommendation.payload.citations.length > 0 && (
                <div>
                  <button type="button" onClick={() => setShowCitations((v) => !v)} className="text-xs text-indigo-600 hover:underline font-medium">
                    {showCitations ? '▲ Ẩn nguồn tham khảo' : `▼ Xem nguồn tham khảo (${recommendation.payload.citations.length})`}
                  </button>
                  {showCitations && (
                    <div className="mt-2 space-y-2">
                      {recommendation.payload.citations.map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-md p-2 text-[11px]">
                          <p className="font-semibold text-gray-700 text-[10px] uppercase mb-1">[{i + 1}] {c.source}</p>
                          <p className="text-gray-600 leading-relaxed italic">"{c.excerpt}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Đã bỏ 2 nút "Duyệt khuyến nghị" / "Từ chối" — workflow phê duyệt
                  không cần thiết cho thesis demo. Khuyến nghị từ AI là tham khảo,
                  supervisor/farmer tự quyết định áp dụng hay không. */}
            </div>
          )}
        </div>

        {/* Camera Mode */}
        {inputMode === 'camera' && !selectedImage && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
              {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-6">
                  <Camera className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-center text-sm mb-4">{cameraError}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                    >
                      Thử lại
                    </button>
                    <button
                      onClick={() => handleToggleMode('upload')}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm transition"
                    >
                      Dùng Upload thay thế
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={toggleCamera}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-black/70 transition"
                    title="Đổi camera"
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </button>

                  {stream && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/80 backdrop-blur rounded-full text-white text-xs font-medium">
                      Camera đang hoạt động
                    </div>
                  )}
                </>
              )}
            </div>

            {stream && !cameraError && (
              <button
                onClick={handleCapture}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Chụp ảnh
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">
              Nhấn nút để chụp ảnh lá cây cần phân tích
            </p>
          </div>
        )}

        {/* Upload Mode - Drop zone */}
        {!selectedImage && inputMode === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Tải lên hình ảnh lá cây</h3>
            <p className="text-sm text-gray-500">Kéo thả hoặc nhấn để chọn file</p>
          </div>
        )}

        {/* Preview Image */}
        {selectedImage && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={selectedImage}
                alt="Selected leaf"
                className="w-full h-full object-contain"
              />
              {!result && (
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>


            {!result && (
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !selectedPlotId}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Leaf className="w-5 h-5" />
                    {selectedPlotId ? 'Phân tích bệnh' : 'Chọn lô đất để tiếp tục'}
                  </>
                )}
              </button>
            )}
          </div>
        )}


        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && dangerInfo && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Kết quả phân tích</h3>
              {result.thoi_gian_xu_ly_ms && (
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian xử lý: {result.thoi_gian_xu_ly_ms.toFixed(0)}ms
                </p>
              )}
            </div>

            <div className="p-4 space-y-5">
              {/* Disease Name & Danger */}
              <div className={`${dangerInfo.bg} rounded-xl p-4`}>
                <div className="flex items-center gap-3">
                  <dangerInfo.icon className={`w-8 h-8 ${dangerInfo.color}`} />
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${dangerInfo.color}`}>
                      {result.benh.benh}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {result.benh.disease}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${dangerInfo.color.replace('text-', 'bg-')}/10 ${dangerInfo.color}`}>
                    Độ nguy hiểm: {result.benh.do_nguy_hiem}
                  </span>
                  {result.benh.phan_loai && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 capitalize">
                      {result.benh.phan_loai}
                    </span>
                  )}
                </div>
              </div>

              {/* Severity — chỉ hiển thị khi BE trả về (disease == leaf_rust) */}
              {result.muc_do_nang && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-orange-900 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Mức độ nặng (chỉ áp dụng cho rỉ sắt)
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    {/* 5 ô màu chỉ mức từ 0 (xanh) → 4 (đỏ đậm) */}
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => {
                        const idx = result.muc_do_nang?.level_index ?? 0;
                        const active = i <= idx;
                        const colors = [
                          'bg-green-400',   // 0 healthy
                          'bg-yellow-400',  // 1 nhẹ
                          'bg-orange-400',  // 2 trung
                          'bg-red-400',     // 3 nặng
                          'bg-red-700',     // 4 rất nặng
                        ];
                        return (
                          <div
                            key={i}
                            className={`h-6 w-6 rounded ${
                              active ? colors[i] : 'bg-gray-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-base font-bold text-orange-900">
                      {result.muc_do_nang.level_index}/4
                    </span>
                  </div>
                  <p className="text-sm text-orange-900 font-medium">
                    {result.muc_do_nang.label_vi}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Độ tin cậy: {(result.muc_do_nang.do_chinh_xac * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              {/* Causing Agent */}
              {result.benh.tac_nhan && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Tác nhân gây bệnh
                  </h4>
                  <p className="text-blue-800">{result.benh.tac_nhan}</p>
                  {result.benh.xuc_tac && result.benh.xuc_tac !== result.benh.tac_nhan && (
                    <p className="text-blue-700 text-sm mt-1">Xúc tác: {result.benh.xuc_tac}</p>
                  )}
                </div>
              )}

              {/* Symptoms/Description */}
              {result.benh.chi_tiet && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Triệu chứng
                  </h4>
                  <p className="text-amber-800">{result.benh.chi_tiet}</p>
                </div>
              )}

              {/* Disclaimer thay cho block "Hướng điều trị" cũ.
                  Lý do: 1 ảnh chỉ chẩn đoán 1 cây — không đủ cơ sở để khuyến
                  nghị thuốc/liều cho cả lô. Khuyến nghị xử lý cần dựa trên
                  phiên quét đa điểm (tỉ lệ cây nhiễm + diện tích lô + giống
                  cây + ngày phun gần nhất), tham chiếu tài liệu BVTV chuẩn,
                  và phải được kỹ sư nông học duyệt. Sẽ triển khai ở Phase 2-4. */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Lưu ý — đây chỉ là chẩn đoán 1 cây
                </h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Kết quả trên áp dụng cho riêng cây vừa quét. Để có khuyến
                  nghị xử lý (loại thuốc, liều lượng, chu kỳ phun) cho cả lô,
                  vui lòng tạo <strong>phiên quét đa điểm</strong> — chụp
                  nhiều cây trong lô, hệ thống sẽ tổng hợp mức độ lan rộng
                  và đề xuất phương án dựa trên tài liệu BVTV chuẩn.
                </p>
              </div>

              {/* Accuracy */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Độ chính xác</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${result.benh.do_chinh_xac >= 0.7 ? 'bg-green-500' :
                            result.benh.do_chinh_xac >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${result.benh.do_chinh_xac * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {(result.benh.do_chinh_xac * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {result.benh.do_chinh_xac < 0.3 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Độ chính xác thấp, cần xác nhận thêm từ chuyên gia
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Phân tích mới
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <PwaTabMenu />
    </div>
  );
}

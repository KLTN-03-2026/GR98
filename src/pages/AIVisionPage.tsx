import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, Leaf, AlertTriangle, CheckCircle, 
  XCircle, Loader2, ArrowLeft, RotateCcw, Info, X, FlipHorizontal
} from 'lucide-react';
import { analyzeLeafImage, type AIVisionResult } from '../services/aiVision';

type InputMode = 'upload' | 'camera';

export default function AIVisionPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<AIVisionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Check browser support for camera
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Start camera with proper permission handling
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
      setStream(mediaStream);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current && mediaStream.active) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
      
    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Quyền camera bị từ chối. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy camera. Vui lòng kết nối webcam vào máy tính.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng khác đang dùng camera.');
      } else if (err.name === 'OverconstrainedError') {
        setCameraError('Camera không hỗ trợ độ phân giải yêu cầu. Đang thử lại...');
        // Retry with lower resolution
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: facingMode === 'environment' ? { facingMode: 'user' } : true,
            audio: false
          });
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
  }, [facingMode, stream]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraError(null);
  }, [stream]);

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
  }, [inputMode]);

  // Cleanup on mode change
  useEffect(() => {
    if (inputMode !== 'camera' && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [inputMode, stream]);

  // Toggle front/back camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    if (inputMode === 'camera' && stream) {
      startCamera();
    }
  }, [facingMode]);

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as any);
      }
    }
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!imageFile) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeLeafImage(imageFile);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể phân tích hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <canvas ref={canvasRef} className="hidden" />
      
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-gray-900">AI Vision</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleToggleMode('upload')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                inputMode === 'upload' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => handleToggleMode('camera')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                inputMode === 'camera' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Camera
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
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
              Nhấn nút để chụp ảnh lá sầu riêng cần phân tích
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
            <h3 className="font-medium text-gray-900 mb-2">Tải lên hình ảnh lá sầu riêng</h3>
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
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Leaf className="w-5 h-5" />
                    Phân tích bệnh
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

              {/* Treatment */}
              {result.benh.dieu_tri && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Hướng điều trị
                  </h4>
                  <p className="text-green-800 whitespace-pre-line">{result.benh.dieu_tri}</p>
                </div>
              )}

              {/* Accuracy */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Độ chính xác</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          result.benh.do_chinh_xac >= 0.7 ? 'bg-green-500' : 
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
    </div>
  );
}

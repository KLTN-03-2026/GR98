import type { ContractLegalViewModel } from '@/pages/contracts/contract-legal-view-model';

type Props = {
  vm: ContractLegalViewModel;
};

function shouldShowContractRef(vm: ContractLegalViewModel) {
  return !(vm.contractId === '—' && vm.contractNo === 'BẢN NHÁP');
}

/** Mẫu văn bản pháp lý — dùng chung màn hình + vùng in (#contract-print-root) */
export function ContractLegalTemplate({ vm }: Props) {
  return (
    <article className="contract-legal-doc space-y-4 text-justify text-sm leading-relaxed text-black">
      <header className="text-center">
        <p className="font-semibold uppercase tracking-wide">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
        <p className="font-semibold">Độc lập - Tự do - Hạnh phúc</p>
        <hr className="mx-auto my-3 w-32 border-black" />
        <h1 className="text-base font-bold uppercase">
          Hợp đồng liên kết sản xuất và tiêu thụ nông sản (khoán theo năm)
        </h1>
        {shouldShowContractRef(vm) && (
          <p className="mt-1 font-semibold">
            Số: {vm.contractId} / {vm.contractNo} — {vm.versionLabel}
          </p>
        )}
      </header>

      <ul className="list-inside list-disc space-y-1 text-xs">
        <li>Căn cứ Bộ luật Dân sự số 91/2015/QH13;</li>
        <li>Căn cứ Luật Thương mại số 36/2005/QH11;</li>
        <li>Căn cứ Nghị định số 98/2018/NĐ-CP về liên kết sản xuất và tiêu thụ nông sản;</li>
        <li>Căn cứ nguyên tắc tự nguyện, bình đẳng, cùng có lợi và chia sẻ rủi ro.</li>
      </ul>

      <p>
        Hôm nay, {vm.preambleTodayPart}, {vm.preamblePlacePart}, chúng tôi gồm:
      </p>

      <section>
        <h2 className="font-bold uppercase">Bên A: Công ty hợp tác nông nghiệp {vm.companyName}</h2>
        <ul className="mt-2 list-inside space-y-1 text-xs">
          <li>
            <strong>Đại diện pháp luật:</strong> {vm.legalRepresentative} — Chức vụ: Giám đốc
          </li>
          <li>
            <strong>Người thực hiện &amp; giám sát (supervisorId):</strong> {vm.supervisorId} —{' '}
            {vm.supervisorName}
          </li>
          <li>
            <strong>Tài khoản ngân hàng Bên A:</strong> {vm.companyBank} — Tại: {vm.companyBankPlace}
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold uppercase">Bên B: Hộ nông dân / Chủ trang trại</h2>
        <ul className="mt-2 list-inside space-y-1 text-xs">
          <li>
            <strong>Họ và tên:</strong> {vm.farmerName} — <strong>Số CCCD:</strong> {vm.farmerCccd}
          </li>
          <li>
            <strong>Điện thoại:</strong> {vm.farmerPhone}
          </li>
          <li>
            <strong>Định danh vùng trồng (plotId):</strong> {vm.plotGisId} — <strong>Mã lô:</strong>{' '}
            {vm.plotCode}
          </li>
          <li>
            <strong>Khu vực lô đất dự thảo:</strong> {vm.plotDraftDistrict}, {vm.plotDraftProvince}
          </li>
          <li>
            <strong>Diện tích chuẩn kê khai:</strong> {vm.plotDraftAreaHa} (xấp xỉ {vm.areaM2} m²)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold uppercase">Bản tóm tắt các thông số khoán của hợp đồng</h2>
        <table className="mt-2 w-full border-collapse border border-black text-xs">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 text-left">Thông số</th>
              <th className="border border-black px-2 py-1 text-left">Giá trị chốt</th>
              <th className="border border-black px-2 py-1 text-left">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Loại cây trồng</td>
              <td className="border border-black px-2 py-1">{vm.cropType}</td>
              <td className="border border-black px-2 py-1">Áp dụng suốt thời hạn HĐ</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Khu vực lô đất dự thảo</td>
              <td className="border border-black px-2 py-1">
                {vm.plotDraftDistrict}, {vm.plotDraftProvince}
              </td>
              <td className="border border-black px-2 py-1">Dùng để tạo plot sau khi Admin duyệt</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Phân hạng (grade)</td>
              <td className="border border-black px-2 py-1 font-semibold">{vm.grade}</td>
              <td className="border border-black px-2 py-1">Theo hồ sơ hợp đồng</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Số nợ vật tư mượn</td>
              <td className="border border-black px-2 py-1 font-semibold">{vm.materialDebtVnd}</td>
              <td className="border border-black px-2 py-1">Thu hồi khi thanh toán hàng</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Thời hạn HĐ</td>
              <td className="border border-black px-2 py-1 font-semibold">{vm.termLabel}</td>
              <td className="border border-black px-2 py-1">{vm.termFromTo}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2 text-xs">
        <h2 className="font-bold uppercase">Điều 1: Đối tượng và thời hạn hợp đồng</h2>
        <p>
          <strong>1.1. Đối tượng:</strong> Nông sản {vm.cropType} được thu hoạch tại vùng trồng plotId nêu
          trên.
        </p>
        <p>
          <strong>1.2. Thời hạn hợp đồng:</strong> Hợp đồng có hiệu lực từ {vm.termStartPart} đến hết{' '}
          {vm.termEndPart}. Khi hết hạn, hai bên có thể ký mới hoặc gia hạn bằng văn bản. (Tham chiếu hệ
          thống: ký {vm.signedAtLine}, ngày kết thúc hợp đồng {vm.harvestDueLine}, tạo hồ sơ {vm.createdAtLine})
        </p>
        <p>
          <strong>1.3. Thông tin lô đất dự thảo:</strong> Bên B kê khai khu vực lô đất tại{' '}
          <strong>
            {vm.plotDraftDistrict}, {vm.plotDraftProvince}
          </strong>{' '}
          với diện tích chuẩn <strong>{vm.plotDraftAreaHa}</strong> để làm căn cứ tạo lô đất chính thức sau
          khi hợp đồng được phê duyệt.
        </p>
        <p>
          <strong>1.4. Nghĩa vụ thu mua:</strong> Bên A cam kết thu mua sản lượng đạt chuẩn của Bên B theo
          cơ chế giá vận hành nội bộ tại thời điểm thu mua.
        </p>
        <p>
          <strong>1.5. Lịch thu mua dự kiến:</strong> (Chi tiết lịch đợt thu mua chưa khai báo trên hệ
          thống — bổ sung phụ lục khi có.)
        </p>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1">Đợt</th>
              <th className="border border-black px-2 py-1">Thời gian dự kiến</th>
              <th className="border border-black px-2 py-1">Địa điểm</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 text-center">01</td>
              <td className="border border-black px-2 py-1">………………</td>
              <td className="border border-black px-2 py-1">Điểm tập kết</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 text-center">02</td>
              <td className="border border-black px-2 py-1">………………</td>
              <td className="border border-black px-2 py-1">Điểm tập kết</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2 text-xs">
        <h2 className="font-bold uppercase">Điều 2: Cấp phát vật tư và nợ gốc</h2>
        <p>
          <strong>2.1.</strong> Bên A bàn giao vật tư cho Bên B theo Danh mục tại Phụ lục 01 (nếu có).
        </p>
        <p>
          <strong>2.2.</strong> Xác nhận nợ gốc mượn vật tư: {vm.materialDebtVnd}.
        </p>
        <p>
          <strong>2.3.</strong> Hoàn trả nợ: Bên B có nghĩa vụ hoàn trả đầy đủ nợ gốc bằng cách khấu trừ
          vào tiền bán hàng tại cuối chu kỳ hợp đồng.
        </p>
      </section>

      <section className="text-xs">
        <h2 className="font-bold uppercase">Điều 3: Tiêu chuẩn chất lượng</h2>
        <p>
          Sản phẩm được coi là đạt chất lượng khi đáp ứng Quy chuẩn kỹ thuật quốc gia (QCVN) và không chứa
          hoạt chất cấm. Mọi tranh chấp về chất lượng sẽ được xác định thông qua kết quả kiểm định của tổ
          chức kiểm định độc lập.
        </p>
      </section>

      {/* Điều 4 cũ về giá sàn cố định được lược bỏ theo flow mới. */}

      <section className="space-y-2 text-xs">
        <h2 className="font-bold uppercase">Điều 5: Thanh toán và khấu trừ</h2>
        <p>
          <strong>5.1.</strong> Thanh toán tạm ứng 50% giá trị lô hàng trong vòng 24 giờ sau khi cân (theo
          thỏa thuận thực tế tại phụ lục thanh toán).
        </p>
        <p>
          <strong>5.2.</strong> Khấu trừ nợ vật tư: Bên A thực hiện khấu trừ nợ gốc vật tư từ tiền hàng của
          Bên B theo lộ trình thỏa thuận.
        </p>
      </section>

      <section className="text-xs">
        <h2 className="font-bold uppercase">Điều 8: Vi phạm và phạt</h2>
        <p>
          Bán hàng ra ngoài (side-selling): phạt theo tỷ lệ thỏa thuận nếu Bên B bán hàng cho bên thứ ba khi
          chưa được sự đồng ý của Bên A.
        </p>
      </section>

      <section className="text-xs">
        <h2 className="font-bold uppercase">Điều 9: Chấm dứt hợp đồng</h2>
        <p>
          Hợp đồng chấm dứt khi hết hạn hoặc một bên vi phạm nghiêm trọng các cam kết mà không khắc phục
          trong thời hạn thỏa thuận. Khi chấm dứt, các khoản nợ vật tư và tiền hàng chưa thanh toán vẫn phải
          được đối soát dứt điểm.
        </p>
      </section>

      <section className="text-xs">
        <h2 className="font-bold uppercase">Điều 12: Điều kiện tiên quyết</h2>
        <p>
          Hợp đồng có hiệu lực sau khi hai bên ký tên và Bên B nhận bàn giao vật tư đầu vụ (nếu có). Các
          phụ lục là một phần không tách rời của hợp đồng này.
        </p>
      </section>

      <footer className="pt-4 text-center text-xs">
        <p>
          <em>Hợp đồng được ký {vm.footerSignDatePart}.</em>
        </p>
        <table className="mx-auto mt-6 w-full max-w-lg border-collapse">
          <tbody>
            <tr>
              <td className="w-1/2 px-2 text-center font-bold align-top">Đại diện Bên A</td>
              <td className="w-1/2 px-2 text-center font-bold align-top">Đại diện Bên B</td>
            </tr>
            <tr>
              <td className="px-2 pt-16 text-center text-xs italic">(Ký, đóng dấu)</td>
              <td className="px-2 pt-16 text-center text-xs italic">(Ký, điểm chỉ)</td>
            </tr>
          </tbody>
        </table>
      </footer>
    </article>
  );
}

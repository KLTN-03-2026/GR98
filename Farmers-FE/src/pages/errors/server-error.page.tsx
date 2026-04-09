import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/global/app-logo';

interface ServerErrorPageProps {
  message?: string;
}

export default function ServerErrorPage({ message }: ServerErrorPageProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-(--secondary-200) bg-linear-to-b from-(--secondary-50) via-background to-(--primary-50) p-8 text-center shadow-lg">
        <div className="mb-6 rounded-full border border-(--secondary-200) bg-background p-4 shadow-md">
          <AppLogo height={48} alt="Agri Integration" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-(--secondary-600)">Lỗi 500</p>
        <h1 className="mt-3 text-4xl font-bold text-(--secondary-800)">Lỗi hệ thống tạm thời</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-(--neutral-700)">
          {message ??
            'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng tải lại trang hoặc thử lại sau ít phút.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg bg-(--secondary-500) px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-(--secondary-600)"
          >
            Tải lại trang
          </button>
          <Link
            to="/"
            className="inline-flex items-center rounded-lg border border-(--primary-400) bg-background px-5 py-3 text-sm font-semibold text-(--secondary-700) transition hover:bg-(--primary-50)"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

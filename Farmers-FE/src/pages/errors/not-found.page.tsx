import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/global/app-logo';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-[var(--primary-200)] bg-gradient-to-b from-[var(--primary-50)] via-[var(--background)] to-[var(--secondary-50)] p-8 text-center shadow-[var(--shadow-lg)]">
        <div className="mb-6 rounded-full border border-[var(--secondary-200)] bg-[var(--background)] p-4 shadow-[var(--shadow-md)]">
          <AppLogo alt="Agri Integration" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--secondary-600)]">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold text-[var(--secondary-800)]">Khong tim thay trang</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--neutral-700)]">
          Duong dan ban truy cap khong ton tai hoac da duoc thay doi. Vui long quay lai trang chu de tiep tuc su dung he thong.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-lg bg-[var(--primary-500)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-600)]"
        >
          Ve trang chu
        </Link>
      </div>
    </main>
  );
}

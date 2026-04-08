import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import NotFoundPage from './not-found.page';
import ServerErrorPage from './server-error.page';

export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  if (isRouteErrorResponse(error)) {
    return <ServerErrorPage message={error.statusText || error.data?.message} />;
  }

  if (error instanceof Error) {
    return <ServerErrorPage message={error.message} />;
  }

  return <ServerErrorPage />;
}

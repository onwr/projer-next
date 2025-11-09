import Link from 'next/link';

export const EmptyState = ({ title, description, actionHref, actionLabel }) => (
  <div className="rounded-xl border bg-gray-50 p-8 text-center">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
    {actionHref && actionLabel ? (
      <div className="mt-4">
        <Link href={actionHref} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          {actionLabel}
        </Link>
      </div>
    ) : null}
  </div>
);

export default EmptyState;



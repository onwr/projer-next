export const NotificationItem = ({ title, message, date, isUnread = false }) => (
  <li className={`rounded-lg border p-4 ${isUnread ? 'bg-blue-50' : 'bg-white'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      </div>
      <span className="text-xs text-gray-500">{date}</span>
    </div>
  </li>
);

export default NotificationItem;



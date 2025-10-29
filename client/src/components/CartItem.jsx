export default function CartItem({ item, remove }) {
  return (
    <div className="flex justify-between items-center border-b pb-1">
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-600">₱{item.price} × {item.qty}</p>
      </div>
      <button
        onClick={() => remove(item.id)}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remove
      </button>
    </div>
  );
}

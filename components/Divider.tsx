export default function Divider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200"></span>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-600">or</span>
      </div>
    </div>
  );
}

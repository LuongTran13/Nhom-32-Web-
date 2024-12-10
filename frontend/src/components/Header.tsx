import { Link } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import SignOutButton from "./SignOutButton";

const Header = () => {
  const { isLoggedIn, role } = useAppContext();

  return (
    <div className="bg-blue-800 py-6">
      <div className="container mx-auto flex justify-between">
        <span className="text-3xl text-white font-bold tracking-tight">
          <Link to="/">BookingWEB.com</Link>
        </span>
        <span className="flex space-x-2">
          {isLoggedIn ? (
            <>
              {role === 'user' && (
                <Link
                  className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                  to="/my-bookings">
                  Phòng đã đặt
                </Link>
                )
              } 
              {role === 'host' && (
              <Link
                className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                to="/my-hotels">
                Khách sạn của tôi
              </Link>)
              }
              {role === 'admin' && (
              <Link
                className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                to="/admin">
                  Admin
              </Link>)
              }
              <SignOutButton />
              
            </>
          ) : (
            <Link
              to="/sign-in"
              className="flex bg-white items-center text-blue-600 px-3 font-bold hover:bg-gray-100 rounded-lg border border-gray-300"
            >
              Đăng nhập
            </Link>
          )}
        </span>
      </div>
    </div>
  );
};

export default Header;

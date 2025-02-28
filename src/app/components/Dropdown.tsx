import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { ProfileImage } from "./ProfileImage";

const UserDropdown = () => {
  const session = useSession();
  const user = session.data!.user;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement|null>(null);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setOpen(false); // Close dropdown if click is outside
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

  return (
    <div className="relative flex items-center gap-5">
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen(!open)}
      >
        <ProfileImage size="big" src={user.image} />
        <span className="hover:underline">{user.name}</span>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] right-0 top-[40px] mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg text-black"
        >
          <button
            onClick={() => void signOut()}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

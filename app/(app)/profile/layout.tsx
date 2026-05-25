import ProfileMainContent from "@/components/layout/ProfileMainContent";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <div className="fixed top-(--navbar-height) left-20 bottom-0 z-40 hidden md:block">
        <ProfileSidebar />
      </div>
      <ProfileMainContent>
        {children}
      </ProfileMainContent>
    </div>
  );
}

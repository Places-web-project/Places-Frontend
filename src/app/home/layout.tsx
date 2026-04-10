'use client';

import SideNavbar from '@/components/SideNavbar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <SideNavbar>{children}</SideNavbar>;
}


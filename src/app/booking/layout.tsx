'use client';

import SideNavbar from '@/components/SideNavbar';

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <SideNavbar>{children}</SideNavbar>;
}


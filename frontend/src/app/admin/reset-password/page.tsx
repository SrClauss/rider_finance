"use client";
import { redirect } from 'next/navigation';

export default function RequestResetPage() {
  // reset via email removed - redirect to admin dashboard
  redirect('/admin');
}

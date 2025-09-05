"use client";
import { redirect } from 'next/navigation';

export default function CreateAdminPage() {
  // criação agora é feita via modal na dashboard administrativa; redireciona para /admin
  redirect('/admin/admins');
}

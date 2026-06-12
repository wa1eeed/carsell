import { redirect } from 'next/navigation'

// Redirect legacy /admin/catalog links to the new location
export default function AdminCatalogRedirect() {
  redirect('/admin/settings/brands')
}

import { SiteSettings } from "@/components/SiteSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <SiteSettings />
    </div>
  );
}

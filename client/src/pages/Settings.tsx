import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Fuel, Building2 } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building2 size={20} className="text-[#22C55E]" />
          <h2 className="text-lg font-semibold">Pump Information</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Pump Name</span>
            <span className="font-medium">{user?.pumpName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Pump Code</span>
            <span className="font-medium font-mono">{user?.pumpCode}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Phone</span>
            <span className="font-medium">{user?.phone}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Address</span>
            <span className="font-medium text-right max-w-xs">{user?.address}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon size={20} className="text-[#22C55E]" />
          <h2 className="text-lg font-semibold">About FuelTrack</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Modules</span>
            <span className="font-medium">Sales, Accounting, Employees, Credit</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Fuel Inventory</span>
            <span className="text-zinc-500 text-sm">Not included in this version</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Fuel size={20} className="text-[#22C55E]" />
          <h2 className="text-lg font-semibold">Shift Timings</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-[#27272A]">
            <span className="text-zinc-400">Shift 1</span>
            <span className="font-medium">6:00 AM - 2:00 PM</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Shift 2</span>
            <span className="font-medium">2:00 PM - 10:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

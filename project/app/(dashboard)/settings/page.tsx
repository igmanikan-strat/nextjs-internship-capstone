"use client";

import { User, Shield, Palette, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { clerkClient } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const [selectedSection, setSelectedSection] = useState<"profile" | "security" | "appearance" | "notification">("profile");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [passwords, setPasswords] = useState<{
    old: string;
    new: string;
    confirm: string;
  }>({
    old: "",
    new: "",
    confirm: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");

  const [modal, setModal] = useState({
    visible: false,
    message: "",
    type: "", // 'success' | 'error'
  });

  const closeModal = () => setModal({ visible: false, message: "", type: "" });

  // Populate fullName when user loads
  useEffect(() => {
    if (user) setFullName(user.fullName ?? "");
  }, [user]);

  // page.tsx:50
  // This code is what TypeScript wants.
  async function handleSaveProfile() {
    if (!user || !isLoaded) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      setModal({ visible: true, message: "Full name cannot be empty.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "";


      console.log("Updating Clerk user:", { firstName, lastName });

      // This is the correct way to call user.update according to the Clerk TypeScript types.
      await user.update({ firstName, lastName });

      console.log("✅ Clerk update success");

      // The rest of your code to update your own DB is fine.
      const res = await fetch("/api/users/update-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id, firstName, lastName }),
      });
      if (!res.ok) throw new Error("Failed to update database");

      setModal({ visible: true, message: "Profile updated successfully!", type: "success" });
    } catch (err: any) {
      console.error("Clerk update failed:", JSON.stringify(err, null, 2));
      const msg = err.errors?.[0]?.message || err.message || "Unknown error";
      setModal({ visible: true, message: `❌ Failed to update profile: ${msg}`, type: "error" });
    } finally {
      setSaving(false);
    }
  }

async function handleChangePassword(e: React.FormEvent) {
  e.preventDefault();

  if (!user || !isLoaded) {
    console.log("User not loaded yet.");
    setPasswordMessage("❌ User not loaded. Please try again.");
    return;
  }

  setPasswordMessage("");

  if (passwords.new !== passwords.confirm) {
    setPasswordMessage("❌ Passwords do not match.");
    console.log("Passwords do not match:", passwords.new, passwords.confirm);
    return;
  }

  try {
    console.log("Attempting password update for user:", user.id);

    await user.updatePassword({ newPassword: passwords.new });

    console.log("✅ Password update succeeded.");
    setPasswordMessage("✅ Password updated successfully.");
    setPasswords({ old: "", new: "", confirm: "" });

  } catch (err: any) {
    console.error("Password update failed - full error object:", err);

    if (err.status) console.log("Error status:", err.status);
    if (err.errors) console.log("Clerk error details:", err.errors);
    if (err.body) console.log("Error response body:", err.body);

    // Handle reauthentication manually
    if (err.status === 403 && err.errors?.[0]?.code === "session_reverification_required") {
      setPasswordMessage(
        "❌ Password update failed: Reverification required. Redirecting to login..."
      );
      console.log("Signing out user and redirecting to login...");

      // Sign out the user
      await clerk.signOut();

      // Redirect to sign-in page (you can add redirect back to /settings after login)
      window.location.href = "/sign-in?redirect=/settings";
      return;
    }

    // Handle other errors
    const msg = err.errors?.[0]?.message || err.message || "Unknown error";
    setPasswordMessage(`❌ Failed to update password: ${msg}`);
    setPasswords({ old: "", new: "", confirm: "" });
  }
}

useEffect(() => {
  async function fetchSettings() {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications`);
      if (!res.ok) throw new Error("Failed to fetch notifications settings");
      const data = await res.json();
      setNotificationsEnabled(data.notificationsEnabled);
    } catch (err) {
      console.error("Error fetching notification settings:", err);
    }
  }
  fetchSettings();
}, [user]);


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">Settings</h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
            Manage your account and application preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <nav className="space-y-2">
              {[
                { id: "profile", name: "Profile", icon: User },
                { id: "security", name: "Security", icon: Shield },
                { id: "notification", name: "Notification", icon: Bell },
                { id: "appearance", name: "Appearance", icon: Palette },
                
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSection(item.id as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedSection === item.id
                      ? "bg-blue_munsell-100 dark:bg-blue_munsell-900 text-blue_munsell-700 dark:text-blue_munsell-300"
                      : "text-outer_space-500 dark:text-platinum-500 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
                  }`}
                >
                  <item.icon className="mr-3" size={16} />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-10">
            {selectedSection === "profile" && (
              <div className="bg-white dark:bg-outer_space-500 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-6">Profile Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Full Name</label>
                    <input
                      type="text"
                      value={fullName ?? ""}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white"
                    />


                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Username</label>
                    <input
                      type="text"
                      value={user?.username || ""}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Role</label>
                    <input
                      type="text"
                      value={String(user?.publicMetadata?.role ?? "Managed in Teams")}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "security" && (
              <div className="bg-white dark:bg-outer_space-500 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-6">Security</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Current Password</label>
                      <input
                        type="password"
                        value={passwords.old}
                        onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">New Password</label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Confirm Password</label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-outer_space-400 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    {passwordMessage && <p className="text-sm mt-2">{passwordMessage}</p>}

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600"
                    >
                      Change Password
                    </button>
                  </form>


              </div>
            )}

            {selectedSection === "notification" && (
              <div className="bg-white dark:bg-outer_space-500 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-6">Notification Settings</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={notificationsEnabled}
                    onChange={async (e) => {
                      const value = e.target.checked;
                      setNotificationsEnabled(value);
                      try {
                        await fetch("/api/notifications", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ notificationsEnabled: value }),
                        });
                      } catch (err) {
                        console.error("Failed to update notification setting:", err);
                      }
                    }}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="notifications" className="text-gray-700 dark:text-gray-200">
                    Enable Notifications
                  </label>
                </div>
              </div>
            )}


            {selectedSection === "appearance" && (
              <div className="bg-white dark:bg-outer_space-500 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-6">Appearance</h3>
                <p className="text-sm text-gray-500">Theme toggle coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-lg p-6 max-w-sm w-full shadow-lg ${
              modal.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            <p className="mb-4">{modal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

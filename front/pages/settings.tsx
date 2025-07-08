import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import { authApi } from "../lib/api";
import { toast } from "react-toastify";
import {
  UserCircleIcon,
  LockClosedIcon,
  BellIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    expenseApprovalNotifications: true,
    systemNotifications: true,
    marketingEmails: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        department: user.department || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await authApi.updateProfile(formData);
      await updateUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsUpdating(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // In a real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Notification settings updated");
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: UserCircleIcon },
    { id: "security", name: "Security", icon: LockClosedIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "preferences", name: "Preferences", icon: CogIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Engineering, Marketing, Sales"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : "Update Profile"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters long
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive email notifications for account activity</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: !notificationSettings.emailNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notificationSettings.emailNotifications ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings.emailNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Expense Approval Notifications</h3>
                      <p className="text-sm text-gray-500">Get notified when expenses are approved or rejected</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          expenseApprovalNotifications: !notificationSettings.expenseApprovalNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notificationSettings.expenseApprovalNotifications ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings.expenseApprovalNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">System Notifications</h3>
                      <p className="text-sm text-gray-500">Important system updates and maintenance notices</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          systemNotifications: !notificationSettings.systemNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notificationSettings.systemNotifications ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings.systemNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          marketingEmails: !notificationSettings.marketingEmails,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notificationSettings.marketingEmails ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings.marketingEmails ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleNotificationUpdate}
                    disabled={isUpdating}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Notification Settings"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Theme</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center">
                        <input
                          id="theme-light"
                          name="theme"
                          type="radio"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="theme-light" className="ml-2 text-sm text-gray-700">
                          Light
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="theme-dark"
                          name="theme"
                          type="radio"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="theme-dark" className="ml-2 text-sm text-gray-700">
                          Dark
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="theme-system"
                          name="theme"
                          type="radio"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="theme-system" className="ml-2 text-sm text-gray-700">
                          System
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Language</h3>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Currency</h3>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Date Format</h3>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => toast.success("Preferences saved")}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
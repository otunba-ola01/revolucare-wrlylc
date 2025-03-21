"use client";

import React, { useState, useEffect } from "react"; // react: ^18.2.0
import { useForm } from "react-hook-form"; // ^7.43.9
import { zodResolver } from "@hookform/resolvers/zod"; // ^3.1.0
import { z } from "zod"; // ^3.21.4

import { useAuth } from "../../../hooks/use-auth";
import { useNotificationContext } from "../../../lib/state/notification-provider";
import { cn } from "../../../lib/utils/color";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
  FormActions,
} from "../../../components/ui/form";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../components/ui/card";
import { changePassword } from "../../../lib/api/auth";
import { useToast } from "../../../hooks/use-toast";

// Define Zod schema for account settings form
const accountSettingsSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
});

// Define Zod schema for password change form
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

// Define Zod schema for notification settings form
const notificationSettingsSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  smsNotificationsEnabled: z.boolean(),
});

// Define Zod schema for privacy settings form
const privacySettingsSchema = z.object({
  dataSharingEnabled: z.boolean(),
  profileVisibility: z.enum(["public", "private", "connections"]),
});

// Define Zod schema for theme settings form
const themeSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

// Define Zod schema for accessibility settings form
const accessibilitySettingsSchema = z.object({
  fontSize: z.enum(["small", "medium", "large"]),
  highContrastMode: z.boolean(),
});

/**
 * Main component for the user settings page
 */
const SettingsPage: React.FC = () => {
  // Get user authentication state and user data using useAuth hook
  const { user } = useAuth();

  // Get notification context for notification preferences
  const { preferences, updatePreferences } = useNotificationContext();

  // Create form validation schemas for different settings forms
  // Initialize form state using useForm hook with zod resolver
  const accountForm = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
  });

  const notificationForm = useForm({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotificationsEnabled: preferences?.email || false,
      smsNotificationsEnabled: preferences?.sms || false,
    },
  });

  const privacyForm = useForm({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      dataSharingEnabled: false,
      profileVisibility: "private",
    },
  });

  const themeForm = useForm({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: {
      theme: "system",
    },
  });

  const accessibilityForm = useForm({
    resolver: zodResolver(accessibilitySettingsSchema),
    defaultValues: {
      fontSize: "medium",
      highContrastMode: false,
    },
  });

  // Set up state for loading indicators and form submission
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isAccessibilityLoading, setIsAccessibilityLoading] = useState(false);

  const { toast } = useToast();

  // Create handlers for form submissions (account, password, notifications, privacy)
  const handleAccountSubmit = async (values: z.infer<typeof accountSettingsSchema>) => {
    setIsAccountLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Account settings updated.",
        description: "Your account settings have been successfully updated.",
      });
      accountForm.reset(values);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating account settings.",
        description: "Failed to update account settings. Please try again.",
      });
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    setIsPasswordLoading(true);
    try {
      // Simulate API call
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast({
        title: "Password changed.",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error changing password.",
        description: error?.message || "Failed to change password. Please try again.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleNotificationsSubmit = async (values: z.infer<typeof notificationSettingsSchema>) => {
    setIsNotificationsLoading(true);
    try {
      // Simulate API call
      await updatePreferences({
        channels: {
          email: values.emailNotificationsEnabled,
          sms: values.smsNotificationsEnabled,
          inApp: true, // Assuming in-app notifications are always enabled
        },
      });
      toast({
        title: "Notification preferences updated.",
        description: "Your notification preferences have been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating notification preferences.",
        description: "Failed to update notification preferences. Please try again.",
      });
    } finally {
      setIsNotificationsLoading(false);
  }
};

  const handlePrivacySubmit = async (values: z.infer<typeof privacySettingsSchema>) => {
    setIsPrivacyLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Privacy settings updated.",
        description: "Your privacy settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating privacy settings.",
        description: "Failed to update privacy settings. Please try again.",
      });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const handleThemeSubmit = async (values: z.infer<typeof themeSettingsSchema>) => {
    setIsThemeLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Theme settings updated.",
        description: "Your theme settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating theme settings.",
        description: "Failed to update theme settings. Please try again.",
      });
    } finally {
      setIsThemeLoading(false);
    }
  };

  const handleAccessibilitySubmit = async (values: z.infer<typeof accessibilitySettingsSchema>) => {
    setIsAccessibilityLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Accessibility settings updated.",
        description: "Your accessibility settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating accessibility settings.",
        description: "Failed to update accessibility settings. Please try again.",
      });
    } finally {
      setIsAccessibilityLoading(false);
    }
  };

  // Render page title and description
  // Render tabbed interface with different settings sections
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="theme">Appearance</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-4">
          <AccountSettingsForm
            user={user}
            onSubmit={accountForm.handleSubmit(handleAccountSubmit)}
            isLoading={isAccountLoading}
          />
        </TabsContent>
        <TabsContent value="password" className="space-y-4">
          <PasswordChangeForm
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            isLoading={isPasswordLoading}
          />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsForm
            preferences={preferences}
            onSubmit={notificationForm.handleSubmit(handleNotificationsSubmit)}
            isLoading={isNotificationsLoading}
          />
        </TabsContent>
        <TabsContent value="privacy" className="space-y-4">
          <PrivacySettingsForm
            privacySettings={{ dataSharingEnabled: false, profileVisibility: "private" }} // Replace with actual privacy settings
            onSubmit={privacyForm.handleSubmit(handlePrivacySubmit)}
            isLoading={isPrivacyLoading}
          />
        </TabsContent>
        <TabsContent value="theme" className="space-y-4">
          <ThemeSettingsForm
            themeSettings={{ theme: "system" }} // Replace with actual theme settings
            onSubmit={themeForm.handleSubmit(handleThemeSubmit)}
            isLoading={isThemeLoading}
          />
        </TabsContent>
        <TabsContent value="accessibility" className="space-y-4">
          <AccessibilitySettingsForm
            accessibilitySettings={{ fontSize: "medium", highContrastMode: false }} // Replace with actual accessibility settings
            onSubmit={accessibilityForm.handleSubmit(handleAccessibilitySubmit)}
            isLoading={isAccessibilityLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Component for account settings form
 */
interface AccountSettingsFormProps {
  user: any;
  onSubmit: (values: z.infer<typeof accountSettingsSchema>) => Promise<void>;
  isLoading: boolean;
}

const AccountSettingsForm: React.FC<AccountSettingsFormProps> = ({ user, onSubmit, isLoading }) => {
  // Initialize form with user data
  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Render form fields for name, email, etc.
  // Handle form submission
  // Show loading state during submission
  // Display validation errors
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Update your account information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Update Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

/**
 * Component for password change form
 */
interface PasswordChangeFormProps {
  onSubmit: (values: z.infer<typeof passwordChangeSchema>) => Promise<void>;
  isLoading: boolean;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSubmit, isLoading }) => {
  // Initialize form with empty password fields
  const form = useForm({
    resolver: zodResolver(passwordChangeSchema),
  });

  // Render form fields for current and new password
  // Handle form submission
  // Show loading state during submission
  // Display validation errors
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Current Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="New Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm New Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Change Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

/**
 * Component for notification settings form
 */
interface NotificationSettingsFormProps {
  preferences: any;
  onSubmit: (values: z.infer<typeof notificationSettingsSchema>) => Promise<void>;
  isLoading: boolean;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ preferences, onSubmit, isLoading }) => {
  // Initialize form with current notification preferences
  const form = useForm({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotificationsEnabled: preferences?.channels?.email || false,
      smsNotificationsEnabled: preferences?.channels?.sms || false,
    },
  });

  // Render toggles for different notification types
  // Render channel selection for each notification type
  // Handle form submission
  // Show loading state during submission
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Customize how you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emailNotificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Email Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications via email.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smsNotificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>SMS Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications via SMS.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Update Notifications
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

/**
 * Component for privacy settings form
 */
interface PrivacySettingsFormProps {
  privacySettings: any;
  onSubmit: (values: z.infer<typeof privacySettingsSchema>) => Promise<void>;
  isLoading: boolean;
}

const PrivacySettingsForm: React.FC<PrivacySettingsFormProps> = ({ privacySettings, onSubmit, isLoading }) => {
  // Initialize form with current privacy settings
  const form = useForm({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      dataSharingEnabled: privacySettings?.dataSharingEnabled || false,
      profileVisibility: privacySettings?.profileVisibility || "private",
    },
  });

  // Render toggles for data sharing options
  // Render visibility controls for profile information
  // Handle form submission
  // Show loading state during submission
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control your data sharing and profile visibility.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dataSharingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Data Sharing</FormLabel>
                    <FormDescription>
                      Allow us to share your data with third-party partners.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a visibility option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="connections">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Update Privacy
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

/**
 * Component for theme and appearance settings
 */
interface ThemeSettingsFormProps {
  themeSettings: any;
  onSubmit: (values: z.infer<typeof themeSettingsSchema>) => Promise<void>;
  isLoading: boolean;
}

const ThemeSettingsForm: React.FC<ThemeSettingsFormProps> = ({ themeSettings, onSubmit, isLoading }) => {
  // Initialize form with current theme settings
  const form = useForm({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: {
      theme: themeSettings?.theme || "system",
    },
  });

  // Render theme selection options
  // Render color scheme preferences
  // Handle form submission
  // Show loading state during submission
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of Revolucare.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Update Theme
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

/**
 * Component for accessibility settings
 */
interface AccessibilitySettingsFormProps {
  accessibilitySettings: any;
  onSubmit: (values: z.infer<typeof accessibilitySettingsSchema>) => Promise<void>;
  isLoading: boolean;
}

const AccessibilitySettingsForm: React.FC<AccessibilitySettingsFormProps> = ({ accessibilitySettings, onSubmit, isLoading }) => {
  // Initialize form with current accessibility settings
  const form = useForm({
    resolver: zodResolver(accessibilitySettingsSchema),
    defaultValues: {
      fontSize: accessibilitySettings?.fontSize || "medium",
      highContrastMode: accessibilitySettings?.highContrastMode || false,
    },
  });

  // Render font size controls
  // Render contrast options
  // Render motion reduction toggle
  // Handle form submission
  // Show loading state during submission
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          Adjust settings to improve accessibility.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fontSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a font size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="highContrastMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>High Contrast Mode</FormLabel>
                    <FormDescription>
                      Increase contrast for better visibility.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={isLoading}>
              Update Accessibility
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;
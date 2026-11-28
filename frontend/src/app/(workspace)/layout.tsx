import { AuthProvider } from "@/features/auth/AuthProvider";
import { WorkspaceGate } from "@/features/auth/WorkspaceGate";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider><WorkspaceGate>{children}</WorkspaceGate></AuthProvider>;
}

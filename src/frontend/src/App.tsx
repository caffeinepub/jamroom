import { Toaster } from "@/components/ui/sonner";
import EntryScreen from "./components/EntryScreen";
import RoomView from "./components/RoomView";
import { RoomProvider, useRoom } from "./context/RoomContext";

function AppContent() {
  const { session } = useRoom();
  return session ? <RoomView /> : <EntryScreen />;
}

export default function App() {
  return (
    <RoomProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.205 0 0)",
            border: "1px solid oklch(0.32 0 0)",
            color: "oklch(0.92 0 0)",
          },
        }}
      />
    </RoomProvider>
  );
}

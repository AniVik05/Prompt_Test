import { createFileRoute } from "@tanstack/react-router";
import AuthScreen from "@/components/AuthScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IdolSync — K-pop Training Platform" },
      {
        name: "description",
        content: "IdolSync — Sign in to continue your K-pop idol journey.",
      },
      { property: "og:title", content: "IdolSync — K-pop Training Platform" },
      {
        property: "og:description",
        content: "IdolSync — Sign in to continue your K-pop idol journey.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <AuthScreen />;
}

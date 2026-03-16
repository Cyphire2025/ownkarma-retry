import NotFoundPage from "@/components/ui/page-not-found";
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

const DemoOne = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <NotFoundPage />
    </div>
  );
};

const Default = () => {
  return <SmokeBackground />;
};

const Customized = () => {
  return <SmokeBackground smokeColor="#b88a4f" />;
};

export { DemoOne, Default, Customized };

import type { Meta, StoryObj } from "@storybook/react";
import RegisterPage from "../../app/register/page";

const meta: Meta<typeof RegisterPage> = {
  title: "Seiten/Registrierung",
  component: RegisterPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #fafafa, #ffffff)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RegisterPage>;

export const Standard: Story = {
  render: () => <RegisterPage />,
};


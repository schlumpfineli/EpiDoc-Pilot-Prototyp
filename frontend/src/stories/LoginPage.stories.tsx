import type { Meta, StoryObj } from "@storybook/react";
import LoginPage from "../../app/login/page";

const meta: Meta<typeof LoginPage> = {
  title: "Seiten/Login",
  component: LoginPage,
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

type Story = StoryObj<typeof LoginPage>;

export const Standard: Story = {
  render: () => <LoginPage />,
};


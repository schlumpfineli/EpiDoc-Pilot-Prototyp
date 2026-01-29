import type { Meta, StoryObj } from "@storybook/react";
import BefindenPage from "../../app/befinden/page";

const meta: Meta<typeof BefindenPage> = {
  title: "Seiten/Befinden",
  component: BefindenPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f7f7fb, #ffffff)",
          padding: "24px 0",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof BefindenPage>;

export const Standard: Story = {
  render: () => <BefindenPage />,
};


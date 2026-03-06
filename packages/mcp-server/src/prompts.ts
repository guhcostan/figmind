import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "create-screen",
    "Generate a new mobile screen following the project design system",
    {
      description: z.string().describe("What this screen should do (e.g. 'checkout flow', 'login with biometrics')"),
      position: z.string().optional().describe("Canvas position hint, e.g. 'after screen 3' or x,y coordinates"),
    },
    (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a new mobile screen for: ${params.description}

Steps:
1. Call get_design_system_kit — this returns fonts, colors, tokens AND screenshots of existing screens. Study the visual style of existing screens before creating.
2. Use create_component_instance for known components (Status Bar, Button, Back Arrow, Tabs, Accordion).
3. Use create_from_html for all other layout — always use display:flex.
4. Place a Status Bar component at y:0 using the key from the design system kit.
5. Screen frame should be 390×844px (standard mobile).
6. Use only fonts and colors returned by get_design_system_kit.
7. After creating, create_from_html automatically returns a screenshot. Review it: check for truncated text, broken spacing, wrong colors, or missing components. Fix any issues found.
${params.position ? `\nCanvas position hint: ${params.position}` : ""}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "review-screen",
    "Review a Figma screen for design issues and layout problems",
    {
      nodeId: z.string().describe("Node ID of the screen frame to review"),
    },
    (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review the Figma screen with node ID: ${params.nodeId}

Steps:
1. Call export_node to see the current visual state.
2. Call get_full_tree to inspect the node structure.
3. Check for these common issues:
   - Text nodes that are truncated (need textAutoResize = HEIGHT)
   - Frames not filling parent width (need layoutSizingHorizontal = FILL)
   - justify-content:space-between not working (usually caused by HUG instead of FILL)
   - Missing or wrong font weights
   - Colors not matching the design system (use get_design_system_kit to verify)
   - Custom divs where a design system component should be used (Button, Input, etc.)
4. List all issues found with their node IDs.
5. Fix each issue and export_node again to confirm the result visually.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "create-flow",
    "Generate a multi-screen user flow for a new app feature",
    {
      feature: z.string().describe("Feature name (e.g. 'Checkout', 'User Onboarding')"),
      screens: z.string().optional().describe("Number of screens (default: 5)"),
    },
    (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a complete user flow for the feature: ${params.feature}

Number of screens: ${params.screens ?? 5}

Steps:
1. Call get_design_system_kit — this returns fonts, colors, tokens AND screenshots of existing screens. Study the visual style before creating.
2. Plan the screens needed for this flow (entry, form steps, confirmation, success).
3. Create a section on the canvas to group all screens.
4. Create each screen frame (390×844px) spaced 40px apart horizontally.
5. For each screen:
   - Add Status Bar component at y:0
   - Build content with create_from_html using the project's visual style as reference
   - Use design system components (Button, Back Arrow) wherever applicable
   - create_from_html automatically returns a screenshot — review it before moving to next screen
   - Add prototype links between screens using set_reactions
6. After all screens are created, export_batch to do a final visual review and fix any remaining issues.`,
          },
        },
      ],
    })
  );
}

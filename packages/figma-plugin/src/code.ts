figma.showUI(__html__, { width: 320, height: 200 });

interface CommandMessage {
  requestId: string;
  command: string;
  params: Record<string, unknown>;
}

interface ResponseMessage {
  requestId: string;
  result?: unknown;
  error?: string;
}

const WRITE_COMMANDS = new Set([
  "create_tree",
  "create_frame",
  "create_text",
  "create_component_instance",
  "set_node_property",
  "apply_variable_to_node",
  "delete_node",
  "delete_nodes",
  "move_node",
  "duplicate_node",
  "set_image_fill",
  "create_shape",
  "create_from_svg",
  "set_effects",
  "set_fill",
  "set_text_properties",
  "update_auto_layout",
  "set_constraints",
  "apply_style",
  "set_instance_properties",
  "swap_component",
  "detach_instance",
  "group_nodes",
  "ungroup_nodes",
  "boolean_operation",
  "set_reactions",
  "create_page",
  "set_current_page",
  "scroll_into_view",
  "create_section",
  "save_version",
  "create_variable_collection",
  "create_variable",
  "update_variable",
  "delete_variable",
  "delete_variable_collection",
  "add_variable_mode",
  "rename_variable_mode",
  "execute",
]);

figma.ui.onmessage = async (message: CommandMessage) => {
  const { requestId, command, params } = message;
  try {
    if (WRITE_COMMANDS.has(command) && figma.editorType === "dev") {
      throw new Error(
        "Write operations are not allowed in Dev Mode. Please switch to Design Mode in Figma."
      );
    }
    const result = await executeCommand(command, params);
    const response: ResponseMessage = { requestId, result };
    figma.ui.postMessage(response);
  } catch (err) {
    const response: ResponseMessage = {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    };
    figma.ui.postMessage(response);
  }
};

async function executeCommand(
  command: string,
  params: Record<string, unknown>
): Promise<unknown> {
  switch (command) {
    case "create_frame":
      return handleCreateFrame(params);
    case "create_text":
      return handleCreateText(params);
    case "create_component_instance":
      return handleCreateComponentInstance(params);
    case "set_node_property":
      return handleSetNodeProperty(params);
    case "get_selection":
      return handleGetSelection();
    case "get_variable_collections":
      return handleGetVariableCollections();
    case "get_variables":
      return handleGetVariables(params);
    case "create_variable_collection":
      return handleCreateVariableCollection(params);
    case "create_variable":
      return handleCreateVariable(params);
    case "update_variable":
      return handleUpdateVariable(params);
    case "delete_variable":
      return handleDeleteVariable(params);
    case "delete_variable_collection":
      return handleDeleteVariableCollection(params);
    case "add_variable_mode":
      return handleAddVariableMode(params);
    case "rename_variable_mode":
      return handleRenameVariableMode(params);
    case "get_design_system_kit":
      return handleGetDesignSystemKit();
    case "execute":
      return handleExecute(params);
    case "apply_variable_to_node":
      return handleApplyVariableToNode(params);
    case "get_node":
      return handleGetNode(params);
    case "get_children":
      return handleGetChildren(params);
    case "delete_node":
      return handleDeleteNode(params);
    case "delete_nodes":
      return handleDeleteNodes(params);
    case "move_node":
      return handleMoveNode(params);
    case "duplicate_node":
      return handleDuplicateNode(params);
    case "get_full_tree":
      return handleGetFullTree(params);
    case "find_nodes":
      return handleFindNodes(params);
    case "bulk_update":
      return handleBulkUpdate(params);
    case "set_image_fill":
      return handleSetImageFill(params);
    case "get_used_fonts":
      return handleGetUsedFonts();
    case "get_available_fonts":
      return handleGetAvailableFonts();
    case "create_tree":
      return handleCreateTree(params);
    case "create_shape":
      return handleCreateShape(params);
    case "create_from_svg":
      return handleCreateFromSvg(params);
    case "set_effects":
      return handleSetEffects(params);
    case "set_fill":
      return handleSetFill(params);
    case "set_text_properties":
      return handleSetTextProperties(params);
    case "update_auto_layout":
      return handleUpdateAutoLayout(params);
    case "set_constraints":
      return handleSetConstraints(params);
    case "get_local_styles":
      return handleGetLocalStyles(params);
    case "apply_style":
      return handleApplyStyle(params);
    case "get_component_properties":
      return handleGetComponentProperties(params);
    case "set_instance_properties":
      return handleSetInstanceProperties(params);
    case "swap_component":
      return handleSwapComponent(params);
    case "detach_instance":
      return handleDetachInstance(params);
    case "group_nodes":
      return handleGroupNodes(params);
    case "ungroup_nodes":
      return handleUngroupNodes(params);
    case "boolean_operation":
      return handleBooleanOperation(params);
    case "set_reactions":
      return handleSetReactions(params);
    case "get_pages":
      return handleGetPages();
    case "create_page":
      return handleCreatePage(params);
    case "set_current_page":
      return handleSetCurrentPage(params);
    case "scroll_into_view":
      return handleScrollIntoView(params);
    case "create_section":
      return handleCreateSection(params);
    case "save_version":
      return handleSaveVersion(params);
    case "export_node":
      return handleExportNode(params);
    case "export_batch":
      return handleExportBatch(params);
    case "export_page":
      return handleExportPage(params);
    case "get_file_context":
      return handleGetFileContext(params);
    case "get_page_components":
      return handleGetPageComponents(params);
    case "get_all_used_styles":
      return handleGetAllUsedStyles(params);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i], b1 = i + 1 < len ? bytes[i + 1] : 0, b2 = i + 2 < len ? bytes[i + 2] : 0;
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : "=";
  }
  return result;
}

async function nodeToBase64(node: SceneNode, format: "PNG" | "JPG" | "SVG", scale: number): Promise<{ base64: string; mimeType: string }> {
  const settings: ExportSettings = format === "SVG"
    ? { format: "SVG" }
    : { format, constraint: { type: "SCALE", value: scale } };

  const bytes = await node.exportAsync(settings);
  const base64 = bytesToBase64(bytes);

  const mimeType = format === "SVG" ? "image/svg+xml" : format === "JPG" ? "image/jpeg" : "image/png";
  return { base64, mimeType };
}

async function handleExportNode(params: Record<string, unknown>) {
  const nodeId = params.nodeId as string;
  const format = ((params.format as string | undefined) ?? "png").toUpperCase() as "PNG" | "JPG" | "SVG";
  const scale = (params.scale as number | undefined) ?? 2;

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (!("exportAsync" in node)) throw new Error(`Node ${nodeId} cannot be exported`);

  return nodeToBase64(node as SceneNode, format, scale);
}

async function handleExportBatch(params: Record<string, unknown>) {
  const nodeIds = params.nodeIds as string[];
  const format = ((params.format as string | undefined) ?? "png").toUpperCase() as "PNG" | "JPG" | "SVG";
  const scale = (params.scale as number | undefined) ?? 2;

  const results: Array<{ nodeId: string; base64: string; mimeType: string }> = [];

  for (const nodeId of nodeIds) {
    const node = figma.getNodeById(nodeId);
    if (!node || !("exportAsync" in node)) continue;
    const { base64, mimeType } = await nodeToBase64(node as SceneNode, format, scale);
    results.push({ nodeId, base64, mimeType });
  }

  return results;
}

async function handleExportPage(params: Record<string, unknown>) {
  const format = ((params.format as string | undefined) ?? "png").toUpperCase() as "PNG" | "JPG" | "SVG";
  const scale = (params.scale as number | undefined) ?? 0.5;

  const children = figma.currentPage.children.filter((n) => "exportAsync" in n) as SceneNode[];
  if (children.length === 0) throw new Error("No exportable nodes on current page");

  if (children.length === 1) {
    return nodeToBase64(children[0], format, scale);
  }

  const group = figma.group(children, figma.currentPage);
  try {
    const result = await nodeToBase64(group as unknown as SceneNode, format, scale);
    return result;
  } finally {
    figma.ungroup(group);
  }
}

const SKIP_COMPONENT_PATTERNS = ["uxlib", "a11y", "accessibility", "flow header", "spec-doc", "item-spec", "a11y-marker"];

function shouldSkipComponent(name: string): boolean {
  const lower = name.toLowerCase();
  return SKIP_COMPONENT_PATTERNS.some((p) => lower.includes(p));
}

interface ComponentEntry {
  key: string;
  name: string;
  w: number;
  h: number;
}

interface ComponentGroup {
  setName: string;
  isRemote: boolean;
  components: ComponentEntry[];
}

async function handleGetPageComponents(params: Record<string, unknown>) {
  const pageId = params.pageId as string | undefined;
  const root = pageId ? (figma.getNodeById(pageId) as PageNode) : figma.currentPage;
  if (!root) throw new Error(`Page not found: ${pageId}`);

  const groups = new Map<string, ComponentGroup>();

  const instances = root.findAll((n) => n.type === "INSTANCE") as InstanceNode[];

  for (const inst of instances) {
    const comp = inst.mainComponent;
    if (!comp) continue;

    let setName: string;
    try {
      setName = comp.parent?.type === "COMPONENT_SET" ? comp.parent.name : comp.name;
    } catch {
      setName = comp.name;
    }

    if (shouldSkipComponent(setName) || shouldSkipComponent(comp.name)) continue;

    if (!groups.has(setName)) {
      groups.set(setName, { setName, isRemote: comp.remote, components: [] });
    }

    const group = groups.get(setName)!;
    if (!group.components.find((c) => c.key === comp.key)) {
      group.components.push({ key: comp.key, name: comp.name, w: Math.round(inst.width), h: Math.round(inst.height) });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.setName.localeCompare(b.setName));
}

async function handleGetAllUsedStyles(params: Record<string, unknown>) {
  const maxFrames = (params.maxFrames as number | undefined) ?? 5;

  const textStyles = new Map<string, Record<string, unknown>>();
  const colorVariables = new Map<string, Record<string, unknown>>();

  const frames = figma.currentPage.children
    .filter((n) => n.type === "FRAME" || n.type === "COMPONENT" || n.type === "GROUP")
    .slice(0, maxFrames) as SceneNode[];

  for (const frame of frames) {
    const nodes = (frame as FrameNode).findAll(() => true);

    for (const node of nodes) {
      if (node.type === "TEXT") {
        const textNode = node as TextNode;
        const styleId = textNode.textStyleId;
        if (typeof styleId === "string" && styleId && !textStyles.has(styleId)) {
          try {
            const style = figma.getStyleById(styleId) as TextStyle | null;
            if (style) {
              const lh = style.lineHeight as LineHeight;
              textStyles.set(styleId, {
                id: styleId,
                name: style.name,
                fontSize: style.fontSize,
                fontFamily: style.fontName?.family,
                fontStyle: style.fontName?.style,
                lineHeight: lh.unit === "AUTO" ? "AUTO" : `${(lh as { value: number; unit: string }).value}${lh.unit === "PERCENT" ? "%" : "px"}`,
                letterSpacing: style.letterSpacing,
              });
            }
          } catch { /* remote style not accessible — skip */ }
        }
      }

      if ("fills" in node) {
        const fills = (node as GeometryMixin).fills as Paint[];
        if (Array.isArray(fills)) {
          for (const fill of fills) {
            const solidFill = fill as SolidPaint;
            const boundColor = solidFill.boundVariables?.color;
            if (boundColor) {
              const varId = boundColor.id;
              if (!colorVariables.has(varId)) {
                try {
                  const variable = figma.variables.getVariableById(varId);
                  if (variable) {
                    const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
                    const modeId = collection?.defaultModeId;
                    const rawValue = modeId ? variable.valuesByMode[modeId] : undefined;
                    colorVariables.set(varId, {
                      id: varId,
                      name: variable.name,
                      collection: collection?.name ?? "Unknown",
                      resolvedType: variable.resolvedType,
                      value: rawValue,
                    });
                  }
                } catch { /* skip */ }
              }
            }
          }
        }
      }
    }
  }

  return {
    textStyles: Array.from(textStyles.values()),
    colorVariables: Array.from(colorVariables.values()),
  };
}

async function exportPageSnapshot(page: PageNode, scale: number): Promise<string | undefined> {
  const exportable = page.children.filter((n) => "exportAsync" in n) as SceneNode[];
  if (exportable.length === 0) return undefined;

  if (exportable.length === 1) {
    const { base64 } = await nodeToBase64(exportable[0], "PNG", scale);
    return base64;
  }

  const group = figma.group(exportable, page);
  try {
    const { base64 } = await nodeToBase64(group as unknown as SceneNode, "PNG", scale);
    return base64;
  } finally {
    figma.ungroup(group);
  }
}

async function handleGetFileContext(params: Record<string, unknown>) {
  const scale = (params.scale as number | undefined) ?? 0.3;
  const originalPageId = figma.currentPage.id;

  const results: Array<{
    pageId: string;
    pageName: string;
    frameCount: number;
    base64?: string;
  }> = [];

  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);

    const entry: { pageId: string; pageName: string; frameCount: number; base64?: string } = {
      pageId: page.id,
      pageName: page.name,
      frameCount: page.children.length,
    };

    try {
      entry.base64 = await exportPageSnapshot(page, scale);
    } catch {
      // best-effort
    }

    results.push(entry);
  }

  const originalPage = figma.getNodeById(originalPageId) as PageNode;
  if (originalPage) await figma.setCurrentPageAsync(originalPage);

  return results;
}

function resolveParent(parentId: unknown): ChildrenMixin & BaseNode {
  if (parentId) {
    const node = figma.getNodeById(parentId as string);
    if (!node) throw new Error(`Parent node not found: ${parentId}`);
    return node as ChildrenMixin & BaseNode;
  }
  return figma.currentPage;
}

async function handleCreateFrame(params: Record<string, unknown>) {
  const parent = resolveParent(params.parentId);
  const frame = figma.createFrame();
  frame.name = params.name as string;
  frame.resize(params.width as number, params.height as number);
  if (params.x !== undefined) frame.x = params.x as number;
  if (params.y !== undefined) frame.y = params.y as number;
  if (params.cornerRadius !== undefined) frame.cornerRadius = params.cornerRadius as number;

  if (params.fillColor !== undefined) {
    const c = params.fillColor as { r: number; g: number; b: number; a?: number };
    frame.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 }];
  } else {
    frame.fills = [];
  }

  if (params.strokeColor !== undefined) {
    const c = params.strokeColor as { r: number; g: number; b: number };
    frame.strokes = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b } }];
    if (params.strokeWeight !== undefined) frame.strokeWeight = params.strokeWeight as number;
  }

  if (params.layoutMode !== undefined) {
    frame.layoutMode = params.layoutMode as "HORIZONTAL" | "VERTICAL";
    if (params.paddingTop !== undefined) frame.paddingTop = params.paddingTop as number;
    if (params.paddingBottom !== undefined) frame.paddingBottom = params.paddingBottom as number;
    if (params.paddingLeft !== undefined) frame.paddingLeft = params.paddingLeft as number;
    if (params.paddingRight !== undefined) frame.paddingRight = params.paddingRight as number;
    if (params.itemSpacing !== undefined) frame.itemSpacing = params.itemSpacing as number;
    if (params.primaryAxisAlignItems !== undefined) {
      frame.primaryAxisAlignItems = params.primaryAxisAlignItems as "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
    }
    if (params.counterAxisAlignItems !== undefined) {
      frame.counterAxisAlignItems = params.counterAxisAlignItems as "MIN" | "CENTER" | "MAX";
    }
    if (params.primaryAxisSizingMode !== undefined) {
      frame.primaryAxisSizingMode = params.primaryAxisSizingMode as "FIXED" | "AUTO";
    }
    if (params.counterAxisSizingMode !== undefined) {
      frame.counterAxisSizingMode = params.counterAxisSizingMode as "FIXED" | "AUTO";
    }
  }

  (parent as FrameNode).appendChild(frame);
  return { nodeId: frame.id };
}

async function handleCreateText(params: Record<string, unknown>) {
  const family = (params.fontFamily as string) ?? "Inter";
  const weight = (params.fontWeight as string) ?? "Regular";
  const resolvedFont = await loadFontSafely(family, weight);

  const text = figma.createText();
  text.fontName = resolvedFont;
  text.characters = params.characters as string;
  text.x = params.x as number;
  text.y = params.y as number;

  if (params.fontSize !== undefined) text.fontSize = params.fontSize as number;

  if (params.color !== undefined) {
    const c = params.color as { r: number; g: number; b: number; a?: number };
    text.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 }];
  }

  if (params.textAlign !== undefined) {
    text.textAlignHorizontal = params.textAlign as "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  }

  if (params.width !== undefined) {
    text.textAutoResize = "HEIGHT";
    text.resize(params.width as number, text.height);
  }

  const parent = resolveParent(params.parentId);
  (parent as FrameNode).appendChild(text);
  return { nodeId: text.id };
}

async function handleCreateComponentInstance(params: Record<string, unknown>) {
  const component = await figma.importComponentByKeyAsync(params.componentKey as string);
  const instance = component.createInstance();
  const parent = resolveParent(params.parentId);
  (parent as FrameNode).appendChild(instance);
  if (params.x !== undefined) instance.x = params.x as number;
  if (params.y !== undefined) instance.y = params.y as number;
  if (params.properties) {
    instance.setProperties(params.properties as Record<string, string | boolean>);
  }
  return { nodeId: instance.id };
}

async function handleSetNodeProperty(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const property = params.property as string;
  const value = params.value;

  switch (property) {
    case "name":
      node.name = value as string;
      break;
    case "x":
      (node as FrameNode).x = value as number;
      break;
    case "y":
      (node as FrameNode).y = value as number;
      break;
    case "width": {
      const n = node as FrameNode;
      n.resize(value as number, n.height);
      break;
    }
    case "height": {
      const n = node as FrameNode;
      n.resize(n.width, value as number);
      break;
    }
    case "visible":
      (node as SceneNode).visible = value as boolean;
      break;
    case "opacity":
      (node as FrameNode).opacity = value as number;
      break;
    case "fills":
      (node as FrameNode).fills = (typeof value === "string" ? JSON.parse(value) : value) as Paint[];
      break;
    case "strokes":
      (node as FrameNode).strokes = (typeof value === "string" ? JSON.parse(value) : value) as Paint[];
      break;
    case "characters": {
      const textNode = node as TextNode;
      const fontName = textNode.fontName as FontName;
      await loadFontSafely(fontName.family, fontName.style);
      textNode.characters = value as string;
      break;
    }
    default:
      throw new Error(`Unsupported property: ${property}`);
  }

  return { success: true };
}

async function handleGetVariableCollections() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes,
  }));
}

async function handleGetVariables(params: Record<string, unknown>) {
  const variables = await figma.variables.getLocalVariablesAsync();
  const filtered = params.collectionId
    ? variables.filter((v) => v.variableCollectionId === (params.collectionId as string))
    : variables;

  return filtered.map((v) => ({
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    valuesByMode: v.valuesByMode,
  }));
}

async function handleGetSelection() {
  const selection = figma.currentPage.selection;
  return selection.map((node) => serializeNodeRich(node, 0, 0));
}

async function handleCreateVariableCollection(params: Record<string, unknown>) {
  const name = params.name as string;
  const collection = figma.variables.createVariableCollection(name);
  const defaultModeId = collection.defaultModeId;
  if (params.initialModeName) {
    collection.renameMode(defaultModeId, params.initialModeName as string);
  }
  return {
    id: collection.id,
    name: collection.name,
    modes: collection.modes,
    defaultModeId: collection.defaultModeId,
  };
}

async function handleCreateVariable(params: Record<string, unknown>) {
  const collection = figma.variables.getVariableCollectionById(params.collectionId as string);
  if (!collection) throw new Error(`Collection not found: ${params.collectionId}`);

  const variable = figma.variables.createVariable(
    params.name as string,
    collection,
    params.resolvedType as VariableResolvedDataType
  );

  if (params.valuesByMode) {
    const entries = Object.entries(params.valuesByMode as Record<string, unknown>);
    for (const [modeId, value] of entries) {
      variable.setValueForMode(modeId, value as VariableValue);
    }
  } else if (params.value !== undefined) {
    variable.setValueForMode(collection.defaultModeId, params.value as VariableValue);
  }

  if (params.description) variable.description = params.description as string;
  if (params.scopes) variable.scopes = params.scopes as VariableScope[];
  if (params.codeSyntax) {
    const syntax = params.codeSyntax as { WEB?: string; ANDROID?: string; iOS?: string };
    if (syntax.WEB) variable.setVariableCodeSyntax("WEB", syntax.WEB);
    if (syntax.ANDROID) variable.setVariableCodeSyntax("ANDROID", syntax.ANDROID);
    if (syntax.iOS) variable.setVariableCodeSyntax("iOS", syntax.iOS);
  }

  return { id: variable.id, name: variable.name, resolvedType: variable.resolvedType };
}

async function handleUpdateVariable(params: Record<string, unknown>) {
  const variable = await figma.variables.getVariableByIdAsync(params.variableId as string);
  if (!variable) throw new Error(`Variable not found: ${params.variableId}`);

  if (params.name !== undefined) variable.name = params.name as string;
  if (params.description !== undefined) variable.description = params.description as string;
  if (params.scopes !== undefined) variable.scopes = params.scopes as VariableScope[];

  if (params.valuesByMode) {
    for (const [modeId, value] of Object.entries(params.valuesByMode as Record<string, unknown>)) {
      variable.setValueForMode(modeId, value as VariableValue);
    }
  }

  if (params.modeId !== undefined && params.value !== undefined) {
    variable.setValueForMode(params.modeId as string, params.value as VariableValue);
  }

  return { success: true, id: variable.id, name: variable.name };
}

async function handleDeleteVariable(params: Record<string, unknown>) {
  const variable = await figma.variables.getVariableByIdAsync(params.variableId as string);
  if (!variable) throw new Error(`Variable not found: ${params.variableId}`);
  variable.remove();
  return { success: true };
}

async function handleDeleteVariableCollection(params: Record<string, unknown>) {
  const collection = figma.variables.getVariableCollectionById(params.collectionId as string);
  if (!collection) throw new Error(`Collection not found: ${params.collectionId}`);
  collection.remove();
  return { success: true };
}

async function handleAddVariableMode(params: Record<string, unknown>) {
  const collection = figma.variables.getVariableCollectionById(params.collectionId as string);
  if (!collection) throw new Error(`Collection not found: ${params.collectionId}`);
  const modeId = collection.addMode(params.name as string);
  return { modeId, name: params.name };
}

async function handleRenameVariableMode(params: Record<string, unknown>) {
  const collection = figma.variables.getVariableCollectionById(params.collectionId as string);
  if (!collection) throw new Error(`Collection not found: ${params.collectionId}`);
  collection.renameMode(params.modeId as string, params.name as string);
  return { success: true };
}

async function handleGetDesignSystemKit() {
  const [collections, variables, paintStyles, textStyles, effectStyles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalPaintStylesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
  ]);

  const variablesByCollection = collections.map((col) => ({
    id: col.id,
    name: col.name,
    modes: col.modes,
    defaultModeId: col.defaultModeId,
    variables: variables
      .filter((v) => v.variableCollectionId === col.id)
      .map((v) => ({
        id: v.id,
        name: v.name,
        resolvedType: v.resolvedType,
        valuesByMode: v.valuesByMode,
        description: v.description,
        scopes: v.scopes,
        codeSyntax: v.codeSyntax,
      })),
  }));

  const colors = paintStyles.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    paints: s.paints,
  }));

  const typography = textStyles.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    fontSize: s.fontSize,
    fontName: s.fontName,
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
  }));

  const effects = effectStyles.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    effects: s.effects,
  }));

  const usedFonts = new Map<string, Set<string>>();
  function collectFonts(node: BaseNode): void {
    if (node.type === "TEXT") {
      const fontName = (node as TextNode).fontName;
      if (fontName !== figma.mixed) {
        const { family, style } = fontName as FontName;
        if (!usedFonts.has(family)) usedFonts.set(family, new Set());
        usedFonts.get(family)!.add(style);
      }
    }
    if ("children" in node) {
      for (const child of (node as ChildrenMixin).children) collectFonts(child);
    }
  }
  collectFonts(figma.currentPage);

  return {
    variableCollections: variablesByCollection,
    colorStyles: colors,
    textStyles: typography,
    effectStyles: effects,
    fonts: Array.from(usedFonts.entries()).map(([family, styles]) => ({
      family,
      styles: Array.from(styles),
    })),
    summary: {
      variableCollections: collections.length,
      variables: variables.length,
      colorStyles: colors.length,
      textStyles: typography.length,
      effectStyles: effects.length,
    },
  };
}

async function handleExecute(params: Record<string, unknown>) {
  const code = params.code as string;
  const fn = new Function("figma", "console", `return (async () => { ${code} })()`);
  const logs: string[] = [];
  const mockConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(String).join(" ")),
    error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
  };
  const result = await fn(figma, mockConsole);
  return { result: result ?? null, logs };
}

async function handleApplyVariableToNode(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const variable = await figma.variables.getVariableByIdAsync(params.variableId as string);
  if (!variable) throw new Error(`Variable not found: ${params.variableId}`);

  const property = params.property as string;

  if (property === "fills" || property === "strokes") {
    const geomNode = node as GeometryMixin;
    const existingPaints = [...(geomNode[property as "fills" | "strokes"] as Paint[])];
    const basePaint: SolidPaint =
      existingPaints.length > 0
        ? (existingPaints[0] as SolidPaint)
        : { type: "SOLID", color: { r: 0, g: 0, b: 0 } };

    const boundPaint = figma.variables.setBoundVariableForPaint(basePaint, "color", variable);
    (geomNode as GeometryMixin)[property as "fills" | "strokes"] = [
      boundPaint,
      ...existingPaints.slice(1),
    ] as Paint[];
  } else {
    (node as SceneNode & { setBoundVariable: (f: VariableBindableNodeField, v: Variable) => void }).setBoundVariable(
      property as VariableBindableNodeField,
      variable
    );
  }

  return { success: true };
}

async function handleGetNode(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  return serializeNode(node);
}

async function handleGetChildren(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  if (!("children" in node)) return [];
  return (node as ChildrenMixin).children.map(serializeNode);
}

async function handleDeleteNode(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  node.remove();
  return { success: true };
}

async function handleDeleteNodes(params: Record<string, unknown>) {
  const nodeIds = params.nodeIds as string[];
  const results: { nodeId: string; success: boolean; error?: string }[] = [];
  for (const nodeId of nodeIds) {
    try {
      const node = figma.getNodeById(nodeId);
      if (!node) throw new Error(`Node not found: ${nodeId}`);
      node.remove();
      results.push({ nodeId, success: true });
    } catch (err) {
      results.push({ nodeId, success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

async function handleMoveNode(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as SceneNode;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const newParent = figma.getNodeById(params.parentId as string) as ChildrenMixin;
  if (!newParent) throw new Error(`Parent not found: ${params.parentId}`);

  if (params.index !== undefined) {
    newParent.insertChild(params.index as number, node);
  } else {
    newParent.appendChild(node);
  }

  return { success: true };
}

async function handleDuplicateNode(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as SceneNode;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const clone = node.clone();

  if (params.x !== undefined) clone.x = params.x as number;
  else clone.x = node.x + (node.width + 40);

  if (params.y !== undefined) clone.y = params.y as number;
  else clone.y = node.y;

  const parent = params.parentId
    ? (figma.getNodeById(params.parentId as string) as ChildrenMixin & BaseNode)
    : (node.parent as ChildrenMixin & BaseNode);

  (parent as FrameNode).appendChild(clone);
  return { nodeId: clone.id };
}

async function handleSetImageFill(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  if (!("fills" in node)) throw new Error(`Node does not support fills: ${params.nodeId}`);

  const base64 = params.imageBase64 as string;
  const scaleMode = (params.scaleMode as "FILL" | "FIT" | "CROP" | "TILE") ?? "FILL";

  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  const image = figma.createImage(bytes);
  (node as GeometryMixin).fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode }];

  return { success: true, imageHash: image.hash };
}

async function handleGetUsedFonts() {
  const usedFonts = new Map<string, Set<string>>();

  function traverse(node: BaseNode): void {
    if (node.type === "TEXT") {
      const fontName = (node as TextNode).fontName;
      if (fontName !== figma.mixed) {
        const { family, style } = fontName as FontName;
        if (!usedFonts.has(family)) usedFonts.set(family, new Set());
        usedFonts.get(family)!.add(style);
      }
    }
    if ("children" in node) {
      for (const child of (node as ChildrenMixin).children) {
        traverse(child);
      }
    }
  }

  traverse(figma.currentPage);

  return Array.from(usedFonts.entries())
    .map(([family, styles]) => ({ family, styles: Array.from(styles) }))
    .sort((a, b) => a.family.localeCompare(b.family));
}

async function handleGetAvailableFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const families = [...new Set(fonts.map((f) => f.fontName.family))].sort();
  return { families, total: families.length };
}

async function loadFontSafely(family: string, weight: string): Promise<FontName> {
  try {
    await figma.loadFontAsync({ family, style: weight });
    return { family, style: weight };
  } catch {
    try {
      await figma.loadFontAsync({ family, style: "Regular" });
      return { family, style: "Regular" };
    } catch {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      return { family: "Inter", style: "Regular" };
    }
  }
}

interface FigmaTreeNode {
  type: "FRAME" | "TEXT" | "INSTANCE";
  name?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  opacity?: number;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  itemSpacing?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  color?: { r: number; g: number; b: number; a?: number };
  children?: FigmaTreeNode[];
  componentKey?: string;
  instanceProps?: Record<string, string | boolean>;
  textStyleId?: string;
}

async function flushTextOverrides(
  instance: InstanceNode,
  props: Record<string, string | boolean>
): Promise<void> {
  const textEntries = Object.entries(props).filter(([, v]) => typeof v === "string");
  if (textEntries.length === 0) return;

  const textNodes = instance.findAll((n) => n.type === "TEXT") as TextNode[];
  for (const textNode of textNodes) {
    const refs = textNode.componentPropertyReferences;
    if (!refs?.characters) continue;
    const match = textEntries.find(([key]) => key === refs.characters);
    if (!match) continue;
    try {
      const fontName = textNode.fontName as FontName;
      await loadFontSafely(fontName.family, fontName.style);
      textNode.characters = match[1] as string;
    } catch {
      /* skip if text node is not editable */
    }
  }
}

async function buildTreeNode(
  def: FigmaTreeNode,
  parent: ChildrenMixin & BaseNode
): Promise<SceneNode> {
  if (def.type === "INSTANCE" && def.componentKey) {
    const component = await figma.importComponentByKeyAsync(def.componentKey);
    const instance = component.createInstance();
    if (def.name) instance.name = def.name;
    if (def.instanceProps) {
      instance.setProperties(def.instanceProps);
      await flushTextOverrides(instance, def.instanceProps);
    }
    (parent as FrameNode).appendChild(instance);
    if (def.width !== undefined && def.height !== undefined) {
      instance.resize(def.width, def.height);
    } else if (def.width !== undefined) {
      instance.resize(def.width, instance.height);
    } else if (def.height !== undefined) {
      instance.resize(instance.width, def.height);
    }
    if (def.layoutSizingHorizontal) {
      try { instance.layoutSizingHorizontal = def.layoutSizingHorizontal; } catch { /* not in auto-layout parent */ }
    }
    if (def.layoutSizingVertical) {
      try { instance.layoutSizingVertical = def.layoutSizingVertical; } catch { /* not in auto-layout parent */ }
    }
    return instance;
  }

  if (def.type === "TEXT") {
    const family = def.fontFamily ?? "Inter";
    const weight = def.fontWeight ?? "Regular";
    const resolvedFont = await loadFontSafely(family, weight);
    const text = figma.createText();
    text.fontName = resolvedFont;
    text.characters = def.characters ?? "";
    if (def.fontSize !== undefined) text.fontSize = def.fontSize;
    if (def.color !== undefined) {
      const c = def.color;
      text.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 }];
    }
    if (def.textAlign !== undefined) text.textAlignHorizontal = def.textAlign;
    if (def.opacity !== undefined) text.opacity = def.opacity;
    if (def.name) text.name = def.name;
    (parent as FrameNode).appendChild(text);

    if (def.width !== undefined) {
      text.textAutoResize = "HEIGHT";
      text.resize(def.width, text.height);
    }

    const explicitFillH = def.layoutSizingHorizontal === "FILL";

    // In a VERTICAL auto-layout parent, text should fill width and wrap — mirrors CSS block behavior
    const parentFrame = parent as FrameNode;
    const parentIsVertical = "layoutMode" in parentFrame && parentFrame.layoutMode === "VERTICAL";
    if (parentIsVertical && !def.layoutSizingHorizontal && def.width === undefined) {
      try {
        text.layoutSizingHorizontal = "FILL";
        text.textAutoResize = "HEIGHT";
      } catch { /* not in auto-layout parent */ }
    }

    if (def.layoutSizingHorizontal) {
      try {
        text.layoutSizingHorizontal = def.layoutSizingHorizontal;
        if (explicitFillH) text.textAutoResize = "HEIGHT";
      } catch { /* not in auto-layout parent */ }
    }
    if (def.layoutSizingVertical) {
      try { text.layoutSizingVertical = def.layoutSizingVertical; } catch { /* not in auto-layout parent */ }
    }

    if (def.textStyleId) {
      try {
        text.textStyleId = def.textStyleId as string;
      } catch { /* style not accessible — keep manual values */ }
    }

    return text;
  }

  const frame = figma.createFrame();
  if (def.name) frame.name = def.name;

  if (def.fills !== undefined) {
    frame.fills = def.fills;
  } else {
    frame.fills = [];
  }
  if (def.strokes !== undefined) frame.strokes = def.strokes;
  if (def.strokeWeight !== undefined) frame.strokeWeight = def.strokeWeight;
  if (def.opacity !== undefined) frame.opacity = def.opacity;
  if (def.cornerRadius !== undefined) frame.cornerRadius = def.cornerRadius;

  if (def.layoutMode && def.layoutMode !== "NONE") {
    frame.layoutMode = def.layoutMode;
    if (def.primaryAxisAlignItems) frame.primaryAxisAlignItems = def.primaryAxisAlignItems;
    if (def.counterAxisAlignItems) frame.counterAxisAlignItems = def.counterAxisAlignItems;
    if (def.itemSpacing !== undefined) frame.itemSpacing = def.itemSpacing;
    if (def.paddingTop !== undefined) frame.paddingTop = def.paddingTop;
    if (def.paddingBottom !== undefined) frame.paddingBottom = def.paddingBottom;
    if (def.paddingLeft !== undefined) frame.paddingLeft = def.paddingLeft;
    if (def.paddingRight !== undefined) frame.paddingRight = def.paddingRight;
  }

  if (def.width !== undefined && def.height !== undefined) {
    frame.resize(def.width, def.height);
  } else if (def.width !== undefined) {
    frame.resize(def.width, frame.height || 40);
  } else if (def.height !== undefined) {
    frame.resize(frame.width || 100, def.height);
  }

  // Sizing modes set AFTER resize so AUTO overrides the explicit dimensions
  if (def.layoutMode && def.layoutMode !== "NONE") {
    if (def.primaryAxisSizingMode) frame.primaryAxisSizingMode = def.primaryAxisSizingMode;
    if (def.counterAxisSizingMode) frame.counterAxisSizingMode = def.counterAxisSizingMode;
  }

  (parent as FrameNode).appendChild(frame);

  if (def.layoutSizingHorizontal) {
    try { frame.layoutSizingHorizontal = def.layoutSizingHorizontal; } catch { /* not in auto-layout parent */ }
  } else if (def.width === undefined) {
    const parentFrame = parent as FrameNode;
    if ("layoutMode" in parentFrame && parentFrame.layoutMode === "VERTICAL") {
      try { frame.layoutSizingHorizontal = "FILL"; } catch { /* not in auto-layout parent */ }
    }
  }
  if (def.layoutSizingVertical) {
    try { frame.layoutSizingVertical = def.layoutSizingVertical; } catch { /* not in auto-layout parent */ }
  }

  for (const child of def.children ?? []) {
    await buildTreeNode(child, frame);
  }

  return frame;
}

async function handleCreateTree(params: Record<string, unknown>) {
  const tree = params.tree as FigmaTreeNode;
  const parent = resolveParent(params.parentId);
  const node = await buildTreeNode(tree, parent) as FrameNode;
  if (params.x !== undefined) node.x = params.x as number;
  if (params.y !== undefined) node.y = params.y as number;
  return { nodeId: node.id };
}

async function handleCreateShape(params: Record<string, unknown>) {
  const type = params.type as string;
  const parent = resolveParent(params.parentId);
  let node: RectangleNode | EllipseNode | PolygonNode | StarNode | LineNode;

  switch (type) {
    case "ELLIPSE":
      node = figma.createEllipse();
      break;
    case "POLYGON":
      node = figma.createPolygon();
      if (params.pointCount !== undefined) node.pointCount = params.pointCount as number;
      break;
    case "STAR":
      node = figma.createStar();
      if (params.pointCount !== undefined) node.pointCount = params.pointCount as number;
      if (params.innerRadius !== undefined) node.innerRadius = params.innerRadius as number;
      break;
    case "LINE":
      node = figma.createLine();
      break;
    default:
      node = figma.createRectangle();
  }

  if (params.x !== undefined) node.x = params.x as number;
  if (params.y !== undefined) node.y = params.y as number;
  if (params.width !== undefined && params.height !== undefined) {
    node.resize(params.width as number, params.height as number);
  }
  if (params.cornerRadius !== undefined && "cornerRadius" in node) {
    (node as RectangleNode).cornerRadius = params.cornerRadius as number;
  }
  if (params.fillColor !== undefined) {
    const c = params.fillColor as { r: number; g: number; b: number; a?: number };
    node.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 }];
  }
  if (params.strokeColor !== undefined) {
    const c = params.strokeColor as { r: number; g: number; b: number };
    node.strokes = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b } }];
    if (params.strokeWeight !== undefined) node.strokeWeight = params.strokeWeight as number;
  }

  (parent as FrameNode).appendChild(node);
  return { nodeId: node.id };
}

async function handleCreateFromSvg(params: Record<string, unknown>) {
  const svgString = params.svgString as string;
  const node = figma.createNodeFromSvg(svgString);
  if (params.x !== undefined) node.x = params.x as number;
  if (params.y !== undefined) node.y = params.y as number;
  const parent = resolveParent(params.parentId);
  (parent as FrameNode).appendChild(node);
  return { nodeId: node.id };
}

async function handleSetEffects(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  if (!("effects" in node)) throw new Error(`Node does not support effects: ${params.nodeId}`);

  const effects = params.effects as Array<{
    type: string;
    radius: number;
    color?: { r: number; g: number; b: number; a?: number };
    offset?: { x: number; y: number };
    spread?: number;
    blendMode?: string;
    visible?: boolean;
  }>;

  (node as BlendMixin).effects = effects.map((e) => {
    const base = {
      type: e.type as Effect["type"],
      radius: e.radius,
      visible: e.visible ?? true,
      blendMode: (e.blendMode ?? "NORMAL") as BlendMode,
    };
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      return {
        ...base,
        color: { r: e.color?.r ?? 0, g: e.color?.g ?? 0, b: e.color?.b ?? 0, a: e.color?.a ?? 0.25 },
        offset: { x: e.offset?.x ?? 0, y: e.offset?.y ?? 4 },
        spread: e.spread ?? 0,
      } as DropShadowEffect;
    }
    return base as unknown as BlurEffect;
  }) as Effect[];

  return { success: true };
}

async function handleSetFill(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  if (!("fills" in node)) throw new Error(`Node does not support fills: ${params.nodeId}`);

  const fills = params.fills as Array<{
    type: string;
    color?: { r: number; g: number; b: number; a?: number };
    opacity?: number;
    gradientStops?: Array<{ color: { r: number; g: number; b: number; a?: number }; position: number }>;
    gradientTransform?: number[][];
  }>;

  (node as GeometryMixin).fills = fills.map((f) => {
    if (f.type === "SOLID") {
      return {
        type: "SOLID",
        color: { r: f.color!.r, g: f.color!.g, b: f.color!.b },
        opacity: f.opacity ?? f.color?.a ?? 1,
      } as SolidPaint;
    }
    const stops: ColorStop[] = (f.gradientStops ?? []).map((s) => ({
      position: s.position,
      color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a ?? 1 },
    }));
    const transform: Transform = (f.gradientTransform as Transform) ?? [[1, 0, 0], [0, 1, 0]];
    return {
      type: f.type as "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND",
      gradientTransform: transform,
      gradientStops: stops,
    } as GradientPaint;
  }) as Paint[];

  return { success: true };
}

async function handleSetTextProperties(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as TextNode;
  if (!node || node.type !== "TEXT") throw new Error(`Text node not found: ${params.nodeId}`);

  const fontName = node.fontName as FontName;
  await loadFontSafely(fontName.family, fontName.style);

  if (params.letterSpacing !== undefined) {
    node.letterSpacing = params.letterSpacing as LetterSpacing;
  }
  if (params.lineHeight !== undefined) {
    node.lineHeight = params.lineHeight as LineHeight;
  }
  if (params.textDecoration !== undefined) {
    node.textDecoration = params.textDecoration as "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  }
  if (params.textCase !== undefined) {
    node.textCase = params.textCase as "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  }
  if (params.paragraphSpacing !== undefined) {
    node.paragraphSpacing = params.paragraphSpacing as number;
  }
  if (params.textAlignVertical !== undefined) {
    node.textAlignVertical = params.textAlignVertical as "TOP" | "CENTER" | "BOTTOM";
  }

  return { success: true };
}

async function handleUpdateAutoLayout(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as FrameNode;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  if (params.layoutMode !== undefined) {
    node.layoutMode = params.layoutMode as "NONE" | "HORIZONTAL" | "VERTICAL";
  }
  if (params.itemSpacing !== undefined) node.itemSpacing = params.itemSpacing as number;
  if (params.paddingTop !== undefined) node.paddingTop = params.paddingTop as number;
  if (params.paddingBottom !== undefined) node.paddingBottom = params.paddingBottom as number;
  if (params.paddingLeft !== undefined) node.paddingLeft = params.paddingLeft as number;
  if (params.paddingRight !== undefined) node.paddingRight = params.paddingRight as number;
  if (params.primaryAxisAlignItems !== undefined) {
    node.primaryAxisAlignItems = params.primaryAxisAlignItems as "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  }
  if (params.counterAxisAlignItems !== undefined) {
    node.counterAxisAlignItems = params.counterAxisAlignItems as "MIN" | "CENTER" | "MAX";
  }
  if (params.layoutWrap !== undefined) {
    node.layoutWrap = params.layoutWrap as "NO_WRAP" | "WRAP";
  }
  if (params.primaryAxisSizingMode !== undefined) {
    node.primaryAxisSizingMode = params.primaryAxisSizingMode as "FIXED" | "AUTO";
  }
  if (params.counterAxisSizingMode !== undefined) {
    node.counterAxisSizingMode = params.counterAxisSizingMode as "FIXED" | "AUTO";
  }

  return { success: true };
}

async function handleSetConstraints(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as SceneNode & ConstraintMixin;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);
  if (!("constraints" in node)) throw new Error(`Node does not support constraints: ${params.nodeId}`);

  node.constraints = {
    horizontal: (params.horizontal as ConstraintType) ?? node.constraints.horizontal,
    vertical: (params.vertical as ConstraintType) ?? node.constraints.vertical,
  };

  return { success: true };
}

async function handleGetLocalStyles(params: Record<string, unknown>) {
  const type = params.type as string | undefined;
  const results: Record<string, unknown>[] = [];

  if (!type || type === "PAINT") {
    const styles = await figma.getLocalPaintStylesAsync();
    styles.forEach((s) => results.push({ id: s.id, name: s.name, type: "PAINT", key: s.key }));
  }
  if (!type || type === "TEXT") {
    const styles = await figma.getLocalTextStylesAsync();
    styles.forEach((s) => results.push({ id: s.id, name: s.name, type: "TEXT", key: s.key }));
  }
  if (!type || type === "EFFECT") {
    const styles = await figma.getLocalEffectStylesAsync();
    styles.forEach((s) => results.push({ id: s.id, name: s.name, type: "EFFECT", key: s.key }));
  }
  if (!type || type === "GRID") {
    const styles = await figma.getLocalGridStylesAsync();
    styles.forEach((s) => results.push({ id: s.id, name: s.name, type: "GRID", key: s.key }));
  }

  return results;
}

async function handleApplyStyle(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const styleId = params.styleId as string;
  const styleType = params.styleType as string;

  switch (styleType) {
    case "FILL":
      await (node as GeometryMixin & { setFillStyleIdAsync: (id: string) => Promise<void> }).setFillStyleIdAsync(styleId);
      break;
    case "TEXT":
      await (node as TextNode).setTextStyleIdAsync(styleId);
      break;
    case "EFFECT":
      await (node as BlendMixin & { setEffectStyleIdAsync: (id: string) => Promise<void> }).setEffectStyleIdAsync(styleId);
      break;
    case "GRID":
      await (node as FrameNode & { setGridStyleIdAsync: (id: string) => Promise<void> }).setGridStyleIdAsync(styleId);
      break;
    default:
      throw new Error(`Unknown style type: ${styleType}`);
  }

  return { success: true };
}

async function handleGetComponentProperties(params: Record<string, unknown>) {
  let target: ComponentNode | ComponentSetNode | null = null;

  if (params.componentKey) {
    const comp = await figma.importComponentByKeyAsync(params.componentKey as string);
    target = (comp.parent?.type === "COMPONENT_SET" ? comp.parent : comp) as ComponentNode | ComponentSetNode;
  } else if (params.nodeId) {
    const node = figma.getNodeById(params.nodeId as string);
    if (node?.type === "INSTANCE") {
      const main = await (node as InstanceNode).getMainComponentAsync();
      if (main) {
        target = (main.parent?.type === "COMPONENT_SET" ? main.parent : main) as ComponentNode | ComponentSetNode;
      }
    } else if (node?.type === "COMPONENT") {
      const comp = node as ComponentNode;
      target = (comp.parent?.type === "COMPONENT_SET" ? comp.parent : comp) as ComponentNode | ComponentSetNode;
    } else if (node?.type === "COMPONENT_SET") {
      target = node as ComponentSetNode;
    }
  }

  if (!target) throw new Error("Component not found");

  const defs = target.componentPropertyDefinitions;
  return Object.entries(defs).map(([name, def]) => ({
    name,
    type: def.type,
    defaultValue: def.defaultValue,
    variantOptions: "variantOptions" in def ? def.variantOptions : undefined,
  }));
}

async function handleSetInstanceProperties(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as InstanceNode;
  if (!node || node.type !== "INSTANCE") throw new Error(`Instance not found: ${params.nodeId}`);

  const properties = params.properties as Record<string, string | boolean>;
  node.setProperties(properties);
  await flushTextOverrides(node, properties);
  return { success: true };
}

async function handleSwapComponent(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as InstanceNode;
  if (!node || node.type !== "INSTANCE") throw new Error(`Instance not found: ${params.nodeId}`);

  const component = await figma.importComponentByKeyAsync(params.componentKey as string);
  node.swapComponent(component);
  return { success: true };
}

async function handleDetachInstance(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as InstanceNode;
  if (!node || node.type !== "INSTANCE") throw new Error(`Instance not found: ${params.nodeId}`);

  const frame = node.detachInstance();
  return { nodeId: frame.id };
}

async function handleGroupNodes(params: Record<string, unknown>) {
  const nodeIds = params.nodeIds as string[];
  const nodes = nodeIds
    .map((id) => figma.getNodeById(id))
    .filter((n): n is SceneNode => n !== null && "parent" in n);

  if (nodes.length === 0) throw new Error("No valid nodes to group");

  const parent = params.parentId
    ? (figma.getNodeById(params.parentId as string) as ChildrenMixin & BaseNode)
    : (nodes[0].parent as ChildrenMixin & BaseNode);

  const group = figma.group(nodes, parent as Parameters<typeof figma.group>[1]);
  if (params.name) group.name = params.name as string;
  return { nodeId: group.id };
}

async function handleUngroupNodes(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as GroupNode;
  if (!node || node.type !== "GROUP") throw new Error(`Group not found: ${params.nodeId}`);

  const children = figma.ungroup(node);
  return { nodeIds: children.map((c) => c.id) };
}

async function handleBooleanOperation(params: Record<string, unknown>) {
  const nodeIds = params.nodeIds as string[];
  const nodes = nodeIds
    .map((id) => figma.getNodeById(id))
    .filter((n): n is SceneNode => n !== null && "parent" in n);

  if (nodes.length < 2) throw new Error("Boolean operation requires at least 2 nodes");

  const parent = params.parentId
    ? (figma.getNodeById(params.parentId as string) as ChildrenMixin & BaseNode)
    : (nodes[0].parent as ChildrenMixin & BaseNode);

  const operation = params.operation as string;
  let result: BooleanOperationNode;

  switch (operation) {
    case "SUBTRACT":
      result = figma.subtract(nodes, parent as Parameters<typeof figma.subtract>[1]);
      break;
    case "INTERSECT":
      result = figma.intersect(nodes, parent as Parameters<typeof figma.intersect>[1]);
      break;
    case "EXCLUDE":
      result = figma.exclude(nodes, parent as Parameters<typeof figma.exclude>[1]);
      break;
    default:
      result = figma.union(nodes, parent as Parameters<typeof figma.union>[1]);
  }

  return { nodeId: result.id };
}

async function handleSetReactions(params: Record<string, unknown>) {
  const node = figma.getNodeById(params.nodeId as string) as SceneNode;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const reactions = params.reactions as Array<{
    trigger: string;
    destinationId?: string;
    navigation?: string;
    transition?: { type: string; duration: number; easing: string };
  }>;

  const figmaReactions = reactions.map((r) => {
    const trigger = { type: r.trigger } as Trigger;

    if (!r.destinationId) {
      return { trigger, actions: [{ type: "BACK" } as Action] };
    }

    const action = {
      type: "NODE",
      destinationId: r.destinationId,
      navigation: r.navigation ?? "NAVIGATE",
      transition: r.transition
        ? {
            type: r.transition.type,
            duration: r.transition.duration,
            easing: { type: r.transition.easing },
          }
        : null,
      preserveScrollPosition: false,
    } as Action;

    return { trigger, actions: [action] };
  }) as Reaction[];

  await (node as SceneNode & { setReactionsAsync: (r: Reaction[]) => Promise<void> }).setReactionsAsync(figmaReactions);
  return { success: true };
}

async function handleGetPages() {
  return figma.root.children.map((page) => ({
    id: page.id,
    name: page.name,
    frameCount: page.children.length,
  }));
}

async function handleCreatePage(params: Record<string, unknown>) {
  const page = figma.createPage();
  page.name = (params.name as string) ?? "New Page";
  return { pageId: page.id, name: page.name };
}

async function handleSetCurrentPage(params: Record<string, unknown>) {
  const page = figma.getNodeById(params.pageId as string) as PageNode;
  if (!page || page.type !== "PAGE") throw new Error(`Page not found: ${params.pageId}`);
  await figma.setCurrentPageAsync(page);
  return { success: true };
}

async function handleScrollIntoView(params: Record<string, unknown>) {
  const nodeIds = params.nodeIds as string[];
  const nodes = nodeIds
    .map((id) => figma.getNodeById(id))
    .filter((n): n is SceneNode => n !== null && "x" in n);

  if (nodes.length === 0) throw new Error("No valid nodes to scroll to");
  figma.viewport.scrollAndZoomIntoView(nodes);
  return { success: true };
}

async function handleCreateSection(params: Record<string, unknown>) {
  const section = figma.createSection();
  section.name = (params.name as string) ?? "Section";
  if (params.x !== undefined) section.x = params.x as number;
  if (params.y !== undefined) section.y = params.y as number;
  if (params.width !== undefined && params.height !== undefined) {
    section.resizeWithoutConstraints(params.width as number, params.height as number);
  }
  return { nodeId: section.id };
}

async function handleSaveVersion(params: Record<string, unknown>) {
  const title = (params.title as string) ?? "MCP checkpoint";
  const description = params.description as string | undefined;
  await figma.saveVersionHistoryAsync(title, description);
  return { success: true };
}

function serializeNode(node: BaseNode): Record<string, unknown> {
  return serializeNodeRich(node, 0, 0);
}

function serializeNodeRich(
  node: BaseNode,
  depth: number,
  maxDepth: number
): Record<string, unknown> {
  const serialized: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ("x" in node) serialized.x = (node as SceneNode).x;
  if ("y" in node) serialized.y = (node as SceneNode).y;
  if ("width" in node) serialized.width = (node as LayoutMixin).width;
  if ("height" in node) serialized.height = (node as LayoutMixin).height;
  if ("visible" in node) serialized.visible = (node as SceneNode).visible;
  if ("opacity" in node) serialized.opacity = (node as BlendMixin).opacity;
  if ("cornerRadius" in node) serialized.cornerRadius = (node as FrameNode).cornerRadius;

  if ("layoutMode" in node) {
    const f = node as FrameNode;
    serialized.layoutMode = f.layoutMode;
    if (f.layoutMode !== "NONE") {
      serialized.primaryAxisAlignItems = f.primaryAxisAlignItems;
      serialized.counterAxisAlignItems = f.counterAxisAlignItems;
      serialized.primaryAxisSizingMode = f.primaryAxisSizingMode;
      serialized.counterAxisSizingMode = f.counterAxisSizingMode;
      serialized.itemSpacing = f.itemSpacing;
      serialized.paddingTop = f.paddingTop;
      serialized.paddingBottom = f.paddingBottom;
      serialized.paddingLeft = f.paddingLeft;
      serialized.paddingRight = f.paddingRight;
      serialized.layoutWrap = f.layoutWrap;
    }
  }

  if ("layoutSizingHorizontal" in node) {
    serialized.layoutSizingHorizontal = (node as FrameNode).layoutSizingHorizontal;
    serialized.layoutSizingVertical = (node as FrameNode).layoutSizingVertical;
  }

  if ("constraints" in node) {
    serialized.constraints = (node as SceneNode & ConstraintMixin).constraints;
  }

  if (node.type === "TEXT") {
    const t = node as TextNode;
    serialized.characters = t.characters;
    serialized.fontSize = t.fontSize;
    serialized.fontName = t.fontName;
    serialized.textAlignHorizontal = t.textAlignHorizontal;
    serialized.textAutoResize = t.textAutoResize;
    serialized.layoutSizingHorizontal = t.layoutSizingHorizontal;
    serialized.layoutSizingVertical = t.layoutSizingVertical;
  }

  if (node.type === "INSTANCE") {
    const inst = node as InstanceNode;
    try {
      serialized.mainComponentId = inst.mainComponent?.id;
      serialized.mainComponentName = inst.mainComponent?.name;
      serialized.mainComponentKey = inst.mainComponent?.key;
    } catch { /* component might be in external library */ }
    try {
      serialized.componentProperties = inst.componentProperties;
    } catch { /* might not be available */ }
  }

  if ("fills" in node) {
    const fills = (node as GeometryMixin).fills;
    if (Array.isArray(fills)) serialized.fills = fills;
  }

  if ("strokes" in node) {
    const strokes = (node as GeometryMixin).strokes;
    if (Array.isArray(strokes) && strokes.length > 0) {
      serialized.strokes = strokes;
      serialized.strokeWeight = (node as GeometryMixin & { strokeWeight: number }).strokeWeight;
    }
  }

  if ("effects" in node) {
    const effects = (node as BlendMixin).effects;
    if (effects.length > 0) serialized.effects = effects;
  }

  if ("children" in node) {
    const children = (node as ChildrenMixin).children;
    serialized.childCount = children.length;
    if (depth < maxDepth) {
      serialized.children = children.map((c) =>
        serializeNodeRich(c, depth + 1, maxDepth)
      );
    }
  }

  return serialized;
}

async function handleGetFullTree(params: Record<string, unknown>) {
  const nodeId = params.nodeId as string;
  const maxDepth = (params.depth as number) ?? 10;
  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  return serializeNodeRich(node, 0, maxDepth);
}

async function handleFindNodes(params: Record<string, unknown>) {
  const nodeId = params.nodeId as string | undefined;
  const root = nodeId ? figma.getNodeById(nodeId) : figma.currentPage;
  if (!root) throw new Error(`Node not found: ${nodeId}`);

  const textContains = params.textContains as string | undefined;
  const nameContains = params.nameContains as string | undefined;
  const typeFilter = params.type as string | undefined;

  const results: Record<string, unknown>[] = [];

  function search(node: BaseNode): void {
    let matches = true;

    if (typeFilter && node.type !== typeFilter) matches = false;
    if (nameContains && !node.name.toLowerCase().includes(nameContains.toLowerCase()))
      matches = false;
    if (textContains) {
      if (node.type !== "TEXT") {
        matches = false;
      } else {
        const chars = (node as TextNode).characters;
        if (!chars.toLowerCase().includes(textContains.toLowerCase())) matches = false;
      }
    }

    if (matches) {
      const item: Record<string, unknown> = { id: node.id, name: node.name, type: node.type };
      if ("x" in node) item.x = (node as SceneNode).x;
      if ("y" in node) item.y = (node as SceneNode).y;
      if ("width" in node) item.width = (node as LayoutMixin).width;
      if ("height" in node) item.height = (node as LayoutMixin).height;
      if (node.type === "TEXT") item.characters = (node as TextNode).characters;
      results.push(item);
    }

    if ("children" in node) {
      for (const child of (node as ChildrenMixin).children) {
        search(child);
      }
    }
  }

  search(root);
  return results;
}

async function handleBulkUpdate(params: Record<string, unknown>) {
  const updates = params.updates as Array<{
    nodeId: string;
    property: string;
    value: unknown;
  }>;

  const results: Array<{ nodeId: string; success: boolean; error?: string }> = [];

  for (const update of updates) {
    try {
      await handleSetNodeProperty(update as Record<string, unknown>);
      results.push({ nodeId: update.nodeId, success: true });
    } catch (err) {
      results.push({
        nodeId: update.nodeId,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

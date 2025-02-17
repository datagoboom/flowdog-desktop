export const findRootNodes = (nodes, edges) => {
  const nodesWithIncoming = new Set(edges.map(edge => edge.target));
  return nodes.filter(node => !nodesWithIncoming.has(node.id));
};

export const findNextNodes = (nodeId, edges, nodes) => {
  // Ensure edges is an array
  if (!Array.isArray(edges)) {
    console.warn('Edges is not an array:', edges);
    return [];
  }

  // Find all edges where this node is the source
  const connectedEdges = edges.filter(edge => edge.source === nodeId);
  
  // Get the target nodes for these edges
  return connectedEdges.map(edge => {
    const targetNode = nodes.find(node => node.id === edge.target);
    return targetNode;
  }).filter(Boolean); // Remove any undefined nodes
};

export const findPreviousNodes = (nodeId, edges, nodes) => {
  // Ensure edges is an array
  if (!Array.isArray(edges)) {
    console.warn('Edges is not an array:', edges);
    return [];
  }

  // Find all edges where this node is the target
  const connectedEdges = edges.filter(edge => edge.target === nodeId);
  
  // Get the source nodes for these edges
  return connectedEdges.map(edge => {
    const sourceNode = nodes.find(node => node.id === edge.source);
    return sourceNode;
  }).filter(Boolean); // Remove any undefined nodes
}; 
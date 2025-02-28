import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GraphMap = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [mode, setMode] = useState("none"); // "addNode" | "connectNodes" | "delete"
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [nodeLabel, setNodeLabel] = useState("");

    // Handle map clicks to add nodes
    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                if (mode === "addNode") {
                    const newNode = {
                        id: `node-${Date.now()}`, // Unique ID
                        latlng: e.latlng,
                        label: nodeLabel,
                        color: nodeLabel ? "red" : "blue",
                    };

                    setNodes([...nodes, newNode]);
                    setNodeLabel(""); // Clear input field
                }
            },
        });
        return null;
    };

    // Handle node selection for creating edges
    const handleNodeClick = (node) => {
        if (mode === "connectNodes") {
            if (selectedNodes.length < 1) {
                setSelectedNodes([node]);
                setNodes((prevNodes) =>
                    prevNodes.map((n) =>
                        n.id === node.id ? { ...n, color: "yellow" } : n
                    )
                );
            } else {
                const node1 = selectedNodes[0];
                const node2 = node;

                // Prevent self-connections
                if (node1.id === node2.id) {
                    alert("A node cannot connect to itself!");
                    setSelectedNodes([]);
                    return;
                }

                // Create edge
                const newEdge = {
                    id: `edge-${Date.now()}`,
                    node1: node1.id,
                    node2: node2.id,
                };

                setEdges([...edges, newEdge]);
                setSelectedNodes([]);

                // Restore original colors
                setNodes((prevNodes) =>
                    prevNodes.map((n) =>
                        n.id === node1.id || n.id === node2.id
                            ? { ...n, color: n.label ? "red" : "blue" }
                            : n
                    )
                );
            }
        } else if (mode === "delete") {
            deleteNode(node.id);
            setMode("none"); // Reset delete mode
        }
    };

    // Delete node and associated edges
    const deleteNode = (id) => {
        setNodes(nodes.filter((n) => n.id !== id));
        setEdges(edges.filter((e) => e.node1 !== id && e.node2 !== id));
    };

    // Delete edge
    const deleteEdge = (id) => {
        setEdges(edges.filter((e) => e.id !== id));
        setMode("none"); // Reset delete mode
    };

    // Save graph to JSON file
    const saveGraphToFile = () => {
        const graphData = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([graphData], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "graph_data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Load graph from JSON file (Fixes colors and labels issue)
    const loadGraphFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const graphData = JSON.parse(e.target.result);

                // Restore colors correctly
                const updatedNodes = graphData.nodes.map((node) => ({
                    ...node,
                    color: node.label ? "red" : "blue", // Restore correct colors
                }));

                setNodes(updatedNodes);
                setEdges(graphData.edges);
                alert("Graph loaded from file.");
            } catch (error) {
                alert("Invalid file format.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <div className="controls">
                <button className={mode === "addNode" ? "active" : ""} onClick={() => setMode("addNode")}>Add Node</button>
                <button className={mode === "connectNodes" ? "active" : ""} onClick={() => setMode("connectNodes")}>Connect Nodes</button>
                <button className={mode === "delete" ? "active" : ""} onClick={() => setMode("delete")}>Delete</button>
                <button onClick={saveGraphToFile}>Save</button>
                <input type="file" accept=".json" onChange={loadGraphFromFile} />
                <input type="text" placeholder="Enter node label" value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} />
            </div>

            <MapContainer center={[28.6024, -81.2001]} zoom={15} style={{ height: "500px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler />

                {/* Render Edges (behind nodes) */}
                {edges.map((edge) => {
                    const node1 = nodes.find((n) => n.id === edge.node1);
                    const node2 = nodes.find((n) => n.id === edge.node2);

                    if (!node1 || !node2) return null;

                    return (
                        <Polyline
                            key={edge.id}
                            positions={[node1.latlng, node2.latlng]}
                            pathOptions={{ color: "black", dashArray: "5,5" }} // Dotted line
                            eventHandlers={{
                                click: () => {
                                    if (mode === "delete") deleteEdge(edge.id);
                                }
                            }}
                        />
                    );
                })}

                {/* Render Nodes (above edges) */}
                {nodes.map((node) => (
                    <CircleMarker
                        key={node.id}
                        center={node.latlng}
                        radius={8} // Fixed size, no zoom scaling
                        fillColor={node.color}
                        color={node.color}
                        fillOpacity={1}
                        pane="markerPane" // Ensures nodes are above edges
                        eventHandlers={{
                            click: () => handleNodeClick(node),
                        }}
                    >
                        {node.label && <Tooltip permanent>{node.label}</Tooltip>}
                    </CircleMarker>
                ))}
            </MapContainer>

            <style>
                {`
                    .controls {
                        margin-bottom: 10px;
                    }
                    button {
                        margin: 5px;
                        padding: 8px;
                        font-size: 14px;
                        cursor: pointer;
                    }
                    .active {
                        background-color: lightblue;
                    }
                `}
            </style>
        </div>
    );
};

export default GraphMap;
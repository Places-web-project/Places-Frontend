'use client';

import { Desk } from '@/types/desk';
import { useRef, useState, useEffect } from 'react';
import DeskMarker from './DeskMarker';
import { Box, IconButton, Paper, Alert } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BuildIcon from '@mui/icons-material/Build';

interface FloorPlanMapProps {
  desks: Desk[];
  onDeskClick: (desk: Desk) => void;
  onMapClick?: (x: number, y: number) => void;
  isAdminMode?: boolean;
  onDeskMove?: (deskId: number, x: number, y: number) => void;
  floorPlanImage: string;
}

export default function FloorPlanMap({
  desks,
  onDeskClick,
  onMapClick,
  isAdminMode = false,
  onDeskMove,
  floorPlanImage,
}: FloorPlanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedDeskId, setDraggedDeskId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Track image dimensions when it loads
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const updateDimensions = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };

    if (img.complete) {
      updateDimensions();
    } else {
      img.addEventListener('load', updateDimensions);
      return () => img.removeEventListener('load', updateDimensions);
    }
  }, [floorPlanImage]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks in admin mode and when not panning/dragging
    if (!isAdminMode || !onMapClick || isDragging || isPanning) return;
    
    // Don't place desk if clicking on a desk marker or its popup
    const target = e.target as HTMLElement;
    if (target.closest('[data-desk-marker]') || target.closest('[data-desk-popup]')) {
      return;
    }

    // Get the scaled container and image
    const scaledContainer = e.currentTarget.querySelector('[data-scaled-container]') as HTMLElement;
    const img = imageRef.current;
    if (!scaledContainer || !img) return;

    const scaledRect = scaledContainer.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate position relative to the actual image, not the container
    const relativeX = (e.clientX - imgRect.left) / imgRect.width;
    const relativeY = (e.clientY - imgRect.top) / imgRect.height;
    
    // Convert to percentage (0-100)
    const x = Math.max(0, Math.min(100, relativeX * 100));
    const y = Math.max(0, Math.min(100, relativeY * 100));

    onMapClick(x, y);
  };

  const handleDeskMouseDown = (desk: Desk, e: React.MouseEvent) => {
    if (isAdminMode && onDeskMove) {
      e.stopPropagation();
      setIsDragging(true);
      setDraggedDeskId(desk.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && containerRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPan({ x: pan.x + deltaX, y: pan.y + deltaY });
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging && draggedDeskId && onDeskMove && imageRef.current) {
      e.preventDefault();
      const imgRect = imageRef.current.getBoundingClientRect();
      
      // Calculate position relative to the actual image
      const relativeX = (e.clientX - imgRect.left) / imgRect.width;
      const relativeY = (e.clientY - imgRect.top) / imgRect.height;
      
      const x = Math.max(0, Math.min(100, relativeX * 100));
      const y = Math.max(0, Math.min(100, relativeY * 100));
      
      onDeskMove(draggedDeskId, x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedDeskId(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.max(0.5, Math.min(3, prevScale * delta)));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    // Allow panning with:
    // - Middle mouse button
    // - Ctrl/Cmd + left click
    // - Left click when NOT in admin mode (normal user mode)
    if (
      e.button === 1 || 
      (e.button === 0 && (e.ctrlKey || e.metaKey)) ||
      (e.button === 0 && !isAdminMode && !(e.target as HTMLElement).closest('[data-desk-marker]'))
    ) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', bgcolor: 'grey.100' }}>
      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Paper elevation={3}>
          <IconButton
            onClick={() => setScale(s => Math.min(3, s * 1.2))}
            title="Zoom In"
            color="primary"
          >
            <AddCircleIcon />
          </IconButton>
        </Paper>
        <Paper elevation={3}>
          <IconButton
            onClick={() => setScale(s => Math.max(0.5, s * 0.8))}
            title="Zoom Out"
            color="primary"
          >
            <RemoveCircleIcon />
          </IconButton>
        </Paper>
        <Paper elevation={3}>
          <IconButton
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset View"
            color="primary"
          >
            <RestartAltIcon />
          </IconButton>
        </Paper>
      </Box>

      {/* Info Banner */}
      {isAdminMode && (
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
          <Alert
            icon={<BuildIcon />}
            severity="warning"
            sx={{ fontWeight: 600 }}
          >
            Admin Mode: Click to place desk or drag to move
          </Alert>
        </Box>
      )}

      {/* Floor Plan Container */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : isAdminMode ? 'crosshair' : 'grab',
          position: 'relative',
        }}
        onClick={handleMapClick}
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <Box
          data-scaled-container
          sx={{
            position: 'relative',
            display: 'inline-block',
            minWidth: '100%',
            minHeight: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging || isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Image and Markers Wrapper - ensures markers match image dimensions */}
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              width: '100%',
            }}
          >
            {/* Floor Plan Image */}
            <Box
              component="img"
              ref={imageRef}
              src={floorPlanImage}
              alt="Floor Plan"
              sx={{
                width: '100%',
                height: 'auto',
                userSelect: 'none',
                display: 'block',
              }}
              draggable={false}
            />

            {/* Desk Markers - positioned relative to image, matching its exact dimensions */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {desks.map((desk) => (
                <Box
                  key={desk.id}
                  onMouseDown={(e) => handleDeskMouseDown(desk, e)}
                  sx={{ 
                    cursor: isAdminMode ? 'move' : 'pointer',
                    pointerEvents: 'auto',
                  }}
                >
                  <DeskMarker
                    desk={desk}
                    onClick={(d) => {
                      if (!isDragging && !isPanning) {
                        onDeskClick(d);
                      }
                    }}
                    isAdminMode={isAdminMode}
                    mapScale={scale}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

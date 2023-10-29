import { HTMLAttributes, useCallback, useEffect } from "react";
import React, { useRef, useState } from "react";
import volumeImage from "@/public/volume.svg"

const cn = (...names: string[]) => names.join(' ')
const MAX = 100;
const MIN = 0;

export const VolumeSlider: React.FC<{
    value: number
    onChange: (value: number) => void
}> = ({
    value,
    onChange
}) => {
    const [dragOrigin, setDragOrigin] = useState(NaN);
    const [containerSize, setContainerSize] = useState(NaN);
    const [dragPosition, setDragPosition] = useState(NaN);
    const newValue = useRef(NaN);
    const span = MAX - MIN;
    const containerRef = useRef(null as HTMLDivElement);
    const tracking = isFinite(newValue.current);

    useEffect(() => {
        newValue.current = Math.max(MIN, Math.min(MAX,
            value + span * (dragPosition - dragOrigin) / containerSize
        ));
    }, [value, span, dragPosition, dragOrigin, containerSize]);

    const actualPosition = isFinite(newValue.current)
        ? (newValue.current - MIN) / span
        : (value - MIN) / span;

    const mouseUp = useCallback(() => {
        if (isFinite(newValue.current)) {
            onChange(newValue.current);
        }
        setDragOrigin(NaN);
        setContainerSize(NaN);
        setDragPosition(NaN);
    }, []);

    const mouseMove = useCallback((e: MouseEvent) => {
        if (isFinite(newValue.current)) {
            setDragPosition(e.clientX);
        }
    }, []);

    const mouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        setDragPosition(e.clientX);
        setDragOrigin(e.clientX);
        setContainerSize(containerRef.current.getBoundingClientRect().width);
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
        return () => {
            document.removeEventListener('mouseup', mouseUp);
            document.removeEventListener('mousemove', mouseMove);
        }
    }, []);

    return <div
            className={'flex grow h-4 relative'}
            ref={containerRef}
        >
        <div className={'bg-amber-700 rounded-l-full cursor-pointer select-none'}
            onClick={(e) => {
                console.log(e.target);
            }}
            style={{
                width: `${100 * actualPosition}%`,
                willChange: tracking ? 'width' : undefined
            }}
        />

        <img
            src={volumeImage.src}
            draggable={false}
            className={cn(
                'w-0 p-6 -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2',
                'absolute cursor-ew-resize select-none',
                tracking
                    ? 'bg-emerald-300'
                    : 'bg-white'
            )}
            onMouseDown={mouseDown}

            style={{
                left: `${100 * actualPosition}%`,
                willChange: tracking ? 'left' : undefined
            }}
        />

        <div className={'bg-cyan-600 rounded-r-full cursor-pointer select-none'}
            onClick={(e) => {
                console.log(e.target);
            }}
            style={{
                width: `${100 - 100 * actualPosition}%`,
                willChange: tracking ? 'width' : undefined
            }}
        />
    </div>
};
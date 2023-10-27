import { HTMLAttributes, useCallback, useEffect } from "react";
import React, { useRef, useState } from "react";

type CssClass = HTMLAttributes<'div'>['className'];

const cn = (...names: string[]) => names.join(' ')

export const Slider: React.FC<{
    className: CssClass
    trackBeginClassName: CssClass
    trackEndClassName: CssClass
    handleClassName: CssClass
    handleActiveClassName: CssClass
    handleInactiveClassName: CssClass
    min: number
    max: number
    value: number
    onChange: (value: number) => void
}> = ({
    className,
    trackBeginClassName,
    trackEndClassName,
    handleClassName,
    handleActiveClassName,
    handleInactiveClassName,
    min,
    max,
    value,
    onChange
}) => {
    const [dragOrigin, setDragOrigin] = useState(NaN);
    const [containerSize, setContainerSize] = useState(NaN);
    const [dragPosition, setDragPosition] = useState(NaN);
    const newValue = useRef(NaN);
    const span = max - min;
    const containerRef = useRef(null as HTMLDivElement);
    const tracking = isFinite(newValue.current);

    useEffect(() => {
        newValue.current = Math.max(min, Math.min(max,
            value + span * (dragPosition - dragOrigin) / containerSize
        ));
    }, [value, span, dragPosition, dragOrigin, containerSize]);

    console.log('render slider tracking', tracking, 'dragOrigin', dragOrigin,
                'containerSize', containerSize, 'newValue', newValue);

    const actualPosition = isFinite(newValue.current)
        ? (newValue.current - min) / span
        : (value - min) / span;

    const mouseUp = useCallback(() => {
        console.log('mouseup', newValue.current);
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
        console.log('mousedown');
        setDragPosition(e.clientX);
        setDragOrigin(e.clientX);
        setContainerSize(containerRef.current.getBoundingClientRect().width);
    }, []);

    useEffect(() => {
        console.log('attach');
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
        return () => {
            console.log('detach');
            document.removeEventListener('mouseup', mouseUp);
            document.removeEventListener('mousemove', mouseMove);
        }
    }, []);

    console.log('Slider', value, newValue.current, actualPosition);

    return <div
            className={className}
            style={{position: 'relative'}}
            ref={containerRef}
        >
        <div className={trackBeginClassName}
            onClick={(e) => {
                console.log(e.target);
            }}
            style={{
                width: `${100 * actualPosition}%`,
                userSelect: 'none'
            }}
        />

        <div
            className={cn(
                handleClassName,
                tracking ? handleActiveClassName : handleInactiveClassName
            )}
            onMouseDown={mouseDown}

            style={{
                position: 'absolute',
                left: `${100 * actualPosition}%`,
                top: '50%',
                cursor: 'ew-resize',
                userSelect: 'none',
            }}
        />

        <div className={trackEndClassName}
            onClick={(e) => {
                console.log(e.target);
            }}
            style={{
                width: `${100 - 100 * actualPosition}%`,
                userSelect: 'none'
            }}
        />
    </div>
};
import { useCallback, useEffect, useLayoutEffect } from "react";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVolumeControl } from "../graphql/hooks";
import { useAfterDelay } from "../hooks";
import volumeImage from '../assets/volume.svg'
import style from './volumeslider.module.css';

const cn = (...names: string[]) => names.join(' ')
const MAX = 100;
const MIN = 0;

const clientX = (e: MouseEvent | TouchEvent) => {
    return 'clientX' in e ?
        e.clientX :
        e.targetTouches[0].clientX;
}

type DragMode = 'relative' | 'absolute';
type VolumeState = {
    dragOrigin: number,
    dragPosition: number,
    containerWidth: number,
    containerLeft: number,
    mode: DragMode,
};

const calcNewValue = (value: number, state: VolumeState): number => {
    const {
        dragOrigin,
        dragPosition,
        containerWidth,
        containerLeft,
        mode,
    } = state;
    const span = MAX - MIN;

    return Math.max(MIN, Math.min(MAX,
        mode === 'relative'
            ? value + span * (dragPosition - dragOrigin) / containerWidth
            : span * (dragPosition - containerLeft) / containerWidth
    ));
}

export const VolumeSlider: React.FC<{
    value: number
}> = ({
    value: actualVolume,
}) => {
    const [state, setState] = useState<VolumeState>({
        dragOrigin: NaN,
        dragPosition: NaN,
        containerWidth: NaN,
        containerLeft: NaN,
        mode: 'absolute',
    });
    const [hovering, setHovering] = useState(false);
    const [sliderRect, setSliderRect] = useState({
        top: NaN,
        left: NaN,
        width: NaN,
    });
    const trackRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const {volume, setVolume, loading} = useVolumeControl(actualVolume);
    const slowLoading = useAfterDelay(loading, 1000);

    const newValue = calcNewValue(volume, state);
    const tracking = isFinite(newValue);
    const span = MAX - MIN;

    const displayPercent = Math.round(100 *
        ((isFinite(newValue) ? newValue : volume) - MIN) / span);

    const dragEnd = useCallback(() => {
        const newValue = calcNewValue(actualVolume, state);
        if (Math.abs(Math.round(actualVolume - newValue)) >= 1) {
            setVolume(newValue);
        }
        setState({
            dragOrigin: NaN,
            containerLeft: NaN,
            containerWidth: NaN,
            dragPosition: NaN,
            mode: 'absolute',
        });
    }, [setVolume, state, actualVolume]);

    const onMove = useCallback((e: MouseEvent | TouchEvent) => {
        const newValue = calcNewValue(actualVolume, state);
        if (isFinite(newValue)) {
            setState({
                ...state,
                dragPosition: clientX(e)
            });
        }
    }, [actualVolume, state]);

    const dragStart = useCallback((mode: DragMode, e: React.MouseEvent | React.TouchEvent) => {
        if (!trackRef.current) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const x = clientX(e.nativeEvent);
        const {left, width} = trackRef.current.getBoundingClientRect();
        setState({
            ...state,
            dragPosition: x,
            dragOrigin: x,
            mode,
            containerLeft: left,
            containerWidth: width,
        });
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove);

        return () => {
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchend', dragEnd);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
        }
    }, [dragEnd, onMove]);

    useLayoutEffect(() => {
        if (!sliderRef.current) {
            return;
        }
        const {top, left, width} = sliderRef.current.getBoundingClientRect();
        setSliderRect({top, left, width});
    }, [displayPercent]);

    const tooltip = () => {
        if ((!tracking && !hovering)) {
            return <></>
        }
        const headerElement = document.getElementById('app-header');
        if (!headerElement) {
            console.log('No header element!');
            return;
        }
        const headerRect = headerElement.getBoundingClientRect();
        const top = sliderRect.top - headerRect.top;
        const left = sliderRect.left + sliderRect.width / 2 - headerRect.left;
        return createPortal(<div
            className={style.tooltip}
            style={{
                top: `${top - 4}px`,
                left: `${left}px`,
                willChange: tracking ? 'left' : undefined,
            }}
        >
            {displayPercent}%
        </div>, headerElement);
    };

    return <div
        className={style.slider}
        draggable={false}
        onMouseDown={e => dragStart('absolute', e)}
        onTouchStart={e => dragStart('absolute', e)}
    >
        {tooltip()}
        <div className={style.trackContainer} draggable={false} ref={trackRef}>
            <div className={style.trackLeft}
                draggable={false}
                style={{
                    width: `${Math.round(displayPercent)}%`,
                    willChange: tracking ? 'width' : undefined
                }}
            />

            <div
                ref={sliderRef}
                className={style.handle}
                onMouseDown={e => dragStart('relative', e)}
                onTouchStart={e => dragStart('relative', e)}
                onMouseOver={() => setHovering(true)}
                onMouseOut={() => setHovering(false)}
                onTouchCancel={() => setHovering(false)}
                onTouchEnd={() => setHovering(false)}
                style={{
                    left: `${displayPercent}%`,
                    willChange: tracking ? 'left' : undefined,
                }}
            >
                <img
                    alt={`Volume ${displayPercent}%`}
                    src={volumeImage}
                    draggable={false}
                    className={cn(
                        style.sliderImage, 
                        tracking ? style.sliderTracking : ''
                    )}
                />
            </div>

            <div className={style.trackRight}
                draggable={false}
                style={{
                    width: `${100 - displayPercent}%`,
                    willChange: tracking ? 'width' : undefined
                }}
            />
        </div>
    </div>
};
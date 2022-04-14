export type Module
    = ContentModule
    | SeqModule
    | StackModule
    | ForkModule
    | BaseModule

interface BaseModule {
    id?: string
    at?: Binding[]
    meta?: Record<string, any>
    depend?: Record<string, string>
}

const durationFactor = 1000000000

export function isRef(m: Module): m is { id: string } {
    return Object.keys(m).length == 1 && 'id' in m;
}

export function isContent(m: Module): m is ContentModule {
    return 'content' in m
}

export function isSeq(m: Module): m is SeqModule {
    return 'seq' in m
}

export function isStack(m: Module): m is StackModule {
    return 'stack' in m
}

export interface Binding {
    event: 'start' | 'end'
    offset?: number
    play: Module
}

export interface ContentModule extends BaseModule {
    content: ContentSpec
}

export interface SeqModule extends BaseModule {
    seq: Module[]
}

export interface StackModule extends BaseModule {
    stack: Module[]
}

export interface ForkModule extends BaseModule {
    fork: {mod: Module, as?: string}
}

export type ContentSpec = {
    channel: string
    duration: number
} & TriggerSpec

export type TriggerSpec
    = { trigger: any }
    | { switch: { on: string, case: Record<string, any>, else?: 'skip' | 'error' | 'wait' } }



interface ModCur {
    mod: Module
    off: number

    next(): ModCur[]
}

function cur(m: Module): ModCur {
    return {
        mod: m,
        off: 0,
        next(): ModCur[] {
            let n = <ModCur[]>[]
            if (this.mod.at != null) {
                for (let x of this.mod.at) {
                }
            }
            return []
        }
    }
}

type ChannelBlocks = Record<string, { trigger: any, start: number, end: number }[]>
export interface ContentSummary {
    duration: number
    blocks: ChannelBlocks
}

export function content(m: Module, offset: number = 0): ContentSummary {
    let sum = content_specific(m, offset)

    if(m.at !== undefined) {
        for(let bind of m.at) {
            if(!['start', 'end'].includes(bind.event)) {
                console.warn(`unhandled at-binding event: ${bind.event}. skipping.`, bind)
                continue
            }

            let bindOffset = offset + (bind.offset || 0) / durationFactor
            switch(bind.event) {
                case 'end':
                    bindOffset += sum.duration
            }
            let bindSum = content(bind.play, bindOffset)
            for(let chan of Object.keys(bindSum.blocks)) {
                if(!(chan in sum.blocks)) {
                    sum.blocks[chan] = []
                }
                for(let bound of bindSum.blocks[chan])
                    sum.blocks[chan].push(bound)
            }
        }
    }

    return sum
}

function content_specific(m: Module, offset: number = 0): ContentSummary {
    if (isContent(m)) {
        let blk = { start: offset, end: offset + (m.content.duration / durationFactor) }
        let chans = {
            [m.content.channel]: 'trigger' in m.content
                ? [{ ...blk, trigger: m.content.trigger }]
                : [{ ...blk, trigger: Object.values(m.content.switch.case).join(' / ') }]
        }
        return {
            duration: blk.end - blk.start,
            blocks: chans
        }
    }

    if (isSeq(m)) {
        let t = offset
        let x = <ChannelBlocks>{}

        for (let e of m.seq) {
            let sum = content(e, t);
            t += sum.duration

            for (let k of Object.keys(sum.blocks)) {
                if (!(k in x)) {
                    x[k] = []
                }
                for (let v of sum.blocks[k])
                    x[k].push(v)
            }
        }
        return {
            duration: t - offset,
            blocks: x
        }
    }
    if (isStack(m)) {
        let x = <ChannelBlocks>{}
        let dur = 0

        for (let e of m.stack) {
            let sum = content(e, offset)
            if (sum.duration > dur)
                dur = sum.duration;

            for (let k of Object.keys(sum.blocks)) {
                if (!(k in x)) {
                    x[k] = []
                }
                for (let v of sum.blocks[k])
                    x[k].push(v)
            }
        }
        return {
            duration: dur,
            blocks: x
        }
    }

    if('fork' in m) {
        let sum = content(m.fork.mod, offset)
        return {
            duration: 0,
            blocks: sum.blocks
        }
    }

    return {
        duration: 0,
        blocks: {}
    }
}

export function dur(m: Module): Promise<{ seconds?: number, text: string }> {
    return fetch('http://localhost:9999/modules/duration', <any>{
        method: 'POST',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(m),
    }).then(x => x.json())
}
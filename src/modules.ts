export type Module
    = ContentModule
    | SeqModule
    | StackModule
    | BaseModule

interface BaseModule {
    id?: string
    at?: Binding[]
    meta?: Record<string, any>
    depend?: Record<string, string>
}

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
    offset?: string
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

export type ContentSpec = {
    channel: string
    duration: string
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

export function content(m: Module, offset: number = 0): ChannelBlocks {
    if (isContent(m)) {
        let blk = <any>{ start: offset, end: offset + (<any>m.content.duration/1000000000) }
        if ('trigger' in m.content) {
            return {
                [m.content.channel]: [{ ...blk, trigger: m.content.trigger }]
            }
        }
        return {
            [m.content.channel]: [{ ...blk, trigger: m.content.switch }]
        }
    }

    if (isSeq(m)) {
        let t = offset
        let x = <ChannelBlocks>{}

        for(let e of m.seq) {
            let blks = content(e,t)
            let end = Object.values(blks).reduce((a,b)=>{
                let max = b.reduce((x,y)=> y.end > x ? y.end : x, 0)
                return a < max ? max : a
            }, t)
            t = end

            for(let k of Object.keys(blks)) {
                if(!(k in x)) {
                    x[k] = []
                }
                for(let v of blks[k])
                    x[k].push(v)
            }
        }
        return x
    }
    if (isStack(m)) {
        let x = <ChannelBlocks>{}

        for(let e of m.stack) {
            let blks = content(e, offset)
            let end = Object.values(blks).reduce((a,b)=>{
                let max = b.reduce((x,y)=> y.end > x ? y.end : x, 0)
                return a < max ? max : a
            }, offset)

            for(let k of Object.keys(blks)) {
                if(!(k in x)) {
                    x[k] = []
                }
                for(let v of blks[k])
                    x[k].push(v)
            }
        }
        return x
    }
    return {}
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
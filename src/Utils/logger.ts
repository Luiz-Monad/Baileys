import _ from 'lodash'
import P from 'pino'
import PP from 'pino-pretty'

export function hasMember<T> (
    obj: unknown,
    memberName: string
): obj is { [key: string]: T } {
    return typeof obj === 'object' && obj !== null && memberName in obj
}

function objectReplacer (obj: Record<string, unknown>): Record<string, unknown> {
    function fix (o: unknown, r: number): unknown {
        if (r > 5) {
            return '<...>'
        }
        switch (typeof o) {
            case 'undefined':
            case 'function':
            case 'number':
            case 'boolean':
            case 'string':
                return o
        }
        if (_.isEmpty(o)) return o
        if (Array.isArray(o)) {
            return o.map(fix)
        }
        if (
            Buffer.isBuffer(o) ||
            o instanceof Uint8Array ||
            (hasMember(o, 'type') && o.type === 'Buffer')
        ) {
            return '<buffer>'
        }
        if (!_.isObject(o)) return o
        return fixObj(o as Record<string, unknown>, r)
    }
    function fixObj (o: Record<string, unknown>, r: number): Record<string, unknown> {
        const so: Record<string, unknown> = {}
        for (const key in o) {
            const value = o[key]
            if (key === 'err') {
                so[key] = value
            } else {
                so[key] = fix(value, r + 1)
            }
        }
        return so
    }
    return fixObj(obj, 0)
}

export default P({ 
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
    formatters: {
        log: objectReplacer,
    },
 }, PP())
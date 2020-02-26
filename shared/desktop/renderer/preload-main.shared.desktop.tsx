import path from 'path'
import os from 'os'
import {promises as fs} from 'fs'
import * as Electron from 'electron'

const isRenderer = typeof process !== 'undefined' && process.type === 'renderer'
const target = isRenderer ? window : global
const {argv, platform, env, type} = process
const isDarwin = platform === 'darwin'
// @ts-ignore
const pid = isRenderer ? Electron.remote.process.pid : process.pid

const kbProcess = {
  argv,
  env,
  pid,
  platform,
  type,
}

const darwinCopyToKBFSTempUploadFile = isDarwin
  ? async (originalFilePath: string) => {
      const simpleFSSimpleFSMakeTempDirForUploadRpcPromise = (params: void, waitingKey?: any) =>
        new Promise<any>((resolve, reject) => {
          if (!engine) {
            throw new Error('Preload missing engine')
          }
          engine!._rpcOutgoing({
            callback: (error, result) => (error ? reject(error) : resolve(result)),
            method: 'keybase.1.SimpleFS.simpleFSMakeTempDirForUpload',
            params,
            waitingKey,
          })
        })
      const dir = await simpleFSSimpleFSMakeTempDirForUploadRpcPromise()
      const dst = path.join(dir, path.basename(originalFilePath))
      await fs.copyFile(originalFilePath, dst)
      return dst
    }
  : () => {
      throw new Error('unsupported platform')
    }

const generateOutboxID = () => Buffer.from([...Array(8)].map(() => Math.floor(Math.random() * 256)))

// filled in
let engine: any = null
const setEngine = (e: any) => {
  if (engine) {
    throw new Error('only one engine')
  }
  engine = e
}

const darwinCopyToChatTempUploadFile = isDarwin
  ? async (originalFilePath: string): Promise<{outboxID: Buffer; path: string}> => {
      const outboxID = generateOutboxID()
      const localGetUploadTempFileRpcPromise = (params: any, waitingKey?: any) => {
        return new Promise<any>((resolve, reject) => {
          if (!engine) {
            throw new Error('Preload missing engine')
          }
          engine!._rpcOutgoing({
            callback: (error, result) => (error ? reject(error) : resolve(result)),
            method: 'chat.1.local.getUploadTempFile',
            params,
            waitingKey,
          })
        })
      }

      const dst = await localGetUploadTempFileRpcPromise({
        filename: originalFilePath,
        outboxID,
      })
      await fs.copyFile(originalFilePath, dst)
      return {outboxID, path: dst}
    }
  : () => {
      throw new Error('unsupported platform')
    }

target.KB = {
  __dirname: __dirname,
  electron: {
    app: {
      appPath: __STORYSHOT__ ? '' : isRenderer ? Electron.remote.app.getAppPath() : Electron.app.getAppPath(),
    },
  },
  kb: {
    darwinCopyToChatTempUploadFile,
    darwinCopyToKBFSTempUploadFile,
    setEngine,
  },
  os: {
    homedir: os.homedir(),
  },
  path: {
    basename: path.basename,
    extname: path.extname,
    join: path.join,
    resolve: path.resolve,
    sep: path.sep,
  },
  process: kbProcess,
  // punycode, // used by a dep
}

if (isRenderer) {
  // have to do this else electron blows away process after the initial preload, use this to add it back
  setTimeout(() => {
    window.KB.process = kbProcess
  }, 0)
}

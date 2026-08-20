import "server-only"

const LIMITE_LENTO_MS=250

export async function measureServerOperation<T>(operation:string,run:()=>Promise<T>):Promise<T>{
  const inicio=performance.now()
  try{return await run()}
  finally{
    const duracao=Math.round(performance.now()-inicio)
    if(duracao>=LIMITE_LENTO_MS)console.info("[performance] slow operation",{operation,duration_ms:duracao})
  }
}

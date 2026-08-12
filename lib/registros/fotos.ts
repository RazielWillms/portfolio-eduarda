import type{SupabaseClient}from"@supabase/supabase-js"
export const FOTO_BUCKET="fotos-cadastro",FOTO_MAX_BYTES=2*1024*1024,FOTO_MIMES=["image/jpeg","image/png","image/webp"]as const
export async function assinarFoto(supabase:SupabaseClient,path:string|null|undefined){if(!path)return null;const{data,error}=await supabase.storage.from(FOTO_BUCKET).createSignedUrl(path,3600);return error?null:data.signedUrl}
export function validarFoto(file:File){if(!FOTO_MIMES.includes(file.type as(typeof FOTO_MIMES)[number]))return"Use uma imagem JPEG, PNG ou WebP.";if(file.size<=0)return"O arquivo está vazio.";if(file.size>FOTO_MAX_BYTES)return"A foto deve ter no máximo 2 MB.";return null}
export function extensaoFoto(mime:string){return mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg"}

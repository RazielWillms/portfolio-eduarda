import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const iniciais=(nome:string)=>nome.split(/\s+/).filter(Boolean).slice(0,2).map(parte=>parte[0]).join("").toUpperCase()

export function FotoAvatar({nome,src,zoom=1,posX=0,posY=0,className,fallbackClassName}:{nome:string;src?:string|null;zoom?:number;posX?:number;posY?:number;className?:string;fallbackClassName?:string}){
  return <Avatar className={cn("overflow-hidden border",className)}>
    <AvatarImage src={src??undefined} alt={`Foto de ${nome}`} className="object-cover" style={{transform:`translate(${posX}%, ${posY}%) scale(${zoom})`,transformOrigin:"center"}}/>
    <AvatarFallback className={cn("font-bold text-primary",fallbackClassName)}>{iniciais(nome)||"?"}</AvatarFallback>
  </Avatar>
}

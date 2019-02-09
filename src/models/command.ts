import { Message } from "discord.js";

export class Command {
  /** Indica se il comando è abilitato ed utilizzabile */
  enabled?: boolean = true;

  /** La stringa che segue il prefisso del bot. */
  name: string;

  /** La descrizione del comando. */
  description: string = "No description available";

  /** La categoria del comando. Utile per raggruppare i comandi. */
  category?: Command.Category = "general";
  
  /** Mostra come bisogna utilizzare il comando all'utente. Utile per i comandi che necessitano di argomenti. 
   * @example 
   * // for !volume
   * usage: 1-150;
   * // you will see:
   * "Usage: !volume 1-150"
  */
  usage?: string;

  /** Nomi alternativi per richiamare il comando. */
  aliases?: string[];
  
  /** Indica se il comando necessita di argomenti. 
   * Avviserà l'utente se gli argomenti sono necessari ma non sono stati inseriti. */
  args?: boolean;
  
  /** Lo script che verrà eseguito quando il comando viene inserito. */
  execute: (message?: Message, args?: string[]) => any;

  constructor() {}
}

export namespace Command {
  // potrebbe diventare anche un enum
  export type Category = "general" | "music" | "fun" | "admin";
  export const category = {
    general: <Category>"general",
    music: <Category>"music",
    fun: <Category>"fun",
    admin: <Category>"admin"
  };
  
}
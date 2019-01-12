import { Message, Client } from "discord.js";

export class Command {
  /** La stringa che segue il prefisso del bot. */
  name: string;

  /** La descrizione del comando. */
  description: string = "No description available";
  
  /** Mostra come bisogna utilizzare il comando all'utente. Utile principalmente per i comandi che necessitano di argomenti. */
  usage?: string;

  aliases?: string[];
  
  /** Indica se il comando necessita di argomenti. 
   * Avviserà l'utente se gli argomenti sono necessari ma non sono stati inseriti. */
  args?: boolean;
  
  /** Indica se il comando necessita del controllo sul client. */
  client?: boolean;
  
  /** Lo script che verrà eseguito quando il comando viene inserito. */
  execute: (message?: Message, client?: Client, args?: string[]) => any;
}

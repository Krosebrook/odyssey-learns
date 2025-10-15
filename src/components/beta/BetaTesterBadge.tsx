import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const BetaTesterBadge = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold text-sm shadow-lg cursor-help"
            whileHover={{ scale: 1.05 }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(251, 191, 36, 0.3)",
                "0 0 40px rgba(251, 191, 36, 0.5)",
                "0 0 20px rgba(251, 191, 36, 0.3)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <span className="text-lg">👑</span>
            <span>Founding Family</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold mb-1">Founding Family Member</p>
          <p className="text-sm text-muted-foreground">
            Early adopter who helped shape Inner Odyssey during beta testing. 
            Thank you for being part of our journey! 🎉
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
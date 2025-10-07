"use client";

import { useState, useRef, useTransition } from "react";
import {
  UploadCloud,
  File as FileIcon,
  Send,
  Loader2,
  Bot,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { askQuestionAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

type QAPair = {
  question: string;
  answer: string;
  snippet?: string;
};

export function DocuQueryClient() {
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setDocumentText(null);
    setQaPairs([]);
    setCurrentQuestion("");
    setError(null);
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
      });
      return;
    }

    resetState();
    setFile(selectedFile);
    setIsExtracting(true);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const fileReader = new FileReader();
      fileReader.onload = async function () {
        if (this.result) {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjs.getDocument(typedarray).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text +=
              content.items
                .map((item) => ("str" in item ? item.str : ""))
                .join(" ") + "\n";
          }
          setDocumentText(text);
          toast({
            title: "File Processed",
            description: "Your document is ready. You can now ask questions.",
          });
        }
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error("Error extracting text:", err);
      setError("Failed to extract text from the PDF.");
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "Could not extract text from the provided PDF.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !documentText) return;

    setIsAsking(true);

    startTransition(async () => {
      const result = await askQuestionAction({
        documentText,
        question: currentQuestion,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "An error occurred",
          description: result.error,
        });
      } else {
        setQaPairs((prev) => [
          ...prev,
          { question: currentQuestion, ...result },
        ]);
      }
      setCurrentQuestion("");
      setIsAsking(false);
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = droppedFiles;
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const renderFileUploader = () => (
    <Card
      className="w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        <div
          className={cn(
            "border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center transition-colors duration-300",
            isDragging ? "bg-accent/50 border-accent" : "bg-background"
          )}
        >
          {isExtracting ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Analyzing your document...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <UploadCloud className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Upload your PDF</h3>
              <p className="text-muted-foreground">
                Drag and drop your file here or click to browse.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                variant="outline"
              >
                Browse Files
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
                disabled={isExtracting}
              />
            </div>
          )}
        </div>
        {error && <p className="mt-4 text-center text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );

  const renderChatInterface = () => (
    <Card className="w-full flex flex-col" style={{ height: "70vh" }}>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <FileIcon className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-lg">{file?.name}</CardTitle>
            <CardDescription>
              Ready to answer your questions.
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={resetState}>
          <X className="h-5 w-5" />
          <span className="sr-only">Upload another file</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="space-y-6">
            {qaPairs.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p>Ask a question to get started.</p>
                <p className="text-sm">e.g., "What is the main topic?" or "Summarize page 3."</p>
              </div>
            )}
            {qaPairs.map((pair, index) => (
              <div key={index} className="space-y-4">
                {/* User Question */}
                <div className="flex items-start gap-3 justify-end">
                  <p className="bg-primary text-primary-foreground p-3 rounded-lg max-w-lg break-words">
                    {pair.question}
                  </p>
                  <Avatar>
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* AI Answer */}
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <Bot />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary p-3 rounded-lg max-w-lg space-y-3">
                    <p className="break-words">{pair.answer}</p>
                    {pair.snippet && (
                      <blockquote className="border-l-4 border-accent pl-4 py-2 bg-background/50 rounded-r-md">
                        <p className="font-code text-sm text-muted-foreground italic">
                          "{pair.snippet}"
                        </p>
                      </blockquote>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(isAsking || isPending) && (
                 <div className="flex items-start gap-3">
                 <Avatar>
                   <AvatarFallback className="bg-accent text-accent-foreground">
                     <Bot />
                   </AvatarFallback>
                 </Avatar>
                 <div className="bg-secondary p-3 rounded-lg flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Thinking...</span>
                  </div>
               </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleQuestionSubmit} className="flex w-full gap-2">
          <Input
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Ask a question about your document..."
            disabled={isAsking || isPending}
          />
          <Button type="submit" disabled={!currentQuestion.trim() || isAsking || isPending}>
            {isAsking || isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );

  return documentText ? renderChatInterface() : renderFileUploader();
}

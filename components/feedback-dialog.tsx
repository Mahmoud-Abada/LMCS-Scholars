// components/feedback-dialog.tsx
'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function FeedbackDialog() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error("Please enter your feedback before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'nh_rafa@esi.dz',
          from: 'ni_benyettou@esi.dz',
          subject: 'New Feedback from LMCS Lab',
          text: feedback,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Feedback Submission</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${feedback.replace(/\n/g, '<br>')}
              </p>
              <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>This feedback was submitted through the LMCS Lab platform.</p>
              </div>
            </div>
          `
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      toast.success("Thank you for your feedback! We'll review it soon.");
      setFeedback("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to send feedback. Please try again later.");
      console.error("Feedback submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-sm">
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send us feedback</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve the LMCS Lab platform. We appreciate your input!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            id="feedback"
            placeholder="How can we improve your experience?"
            aria-label="Send feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
            minLength={10}
            disabled={isSubmitting}
            className="min-h-[120px]"
          />
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !feedback.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : "Send feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
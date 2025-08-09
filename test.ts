import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "https://deno.land/x/resend@v2.2.0/mod.ts";

const resend = new Resend(("re_f4p5RwxF_GXkAikoAHZfUxw3hhCebvbJG"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest { 
  name: string;
  email: string;
  industry: string;
}
const generatePersonalizedContent = async (name: string, industry: string) => {
  console.log('hellow')
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing exciting welcome emails...'
          },
          {
            role: 'user',
            content: `Create a personalized welcome email for ${name} who works in the ${industry} industry...`
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'OpenAI failed');
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('No message content from OpenAI');

    return content;
  } catch (error) {
    console.error('AI content fallback used:', error.message);
    return `Hi ${name}! 🚀 Welcome to our innovation community...`;
  }
};


const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, industry }: ConfirmationEmailRequest = await req.json();

    console.log(`Generating personalized email for ${name} from ${industry} industry`);

    // Generate personalized content using AI
    const personalizedContent = await generatePersonalizedContent(name, industry);

    console.log(`Generated content: ${personalizedContent}`);

    const emailResponse = await resend.emails.send({
      from: "Innovation Community <testing-email@lovable.dev>",
      to: [email],
      subject: `Welcome to the Innovation Revolution, ${name}! 🚀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🚀 Welcome to the Innovation Revolution!</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px;">
            <div style="font-size: 18px; line-height: 1.6;">
           ${(personalizedContent || '').replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>🎯 <strong>Exclusive insights</strong> tailored to ${industry}</li>
              <li>💡 <strong>Early access</strong> to industry-changing innovations</li>
              <li>🤝 <strong>Connect</strong> with ${industry} leaders and visionaries</li>
              <li>📈 <strong>Transform your approach</strong> to ${industry} challenges</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0;">
              Ready to revolutionize ${industry}?<br>
              <strong>The Innovation Community Team</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Personalized email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
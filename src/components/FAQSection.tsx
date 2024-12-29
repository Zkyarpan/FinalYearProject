"use client";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is Mentality and how does it work?",
      answer:
        "Mentality is a mental health and support application that connects users with licensed psychologists, offers personalized resources, and provides interactive features to promote mental well-being. Users can sign up, complete their profile, and access features like chatting with psychologists, participating in surveys, and booking video consultations. The platform ensures privacy and ease of use for all its members.",
    },
    {
      question: "How do I book a session with a psychologist?",
      answer:
        "To book a session, first complete your profile under the 'Profile Completion' section. Once your profile is complete, you can browse available psychologists, choose one that suits your needs, and schedule a session through the app. Payments can be securely made via integrated payment gateways before confirming the session.",
    },
    {
      question: "What are the personalized resources offered by Mentality?",
      answer:
        "Mentality provides a range of resources such as articles, videos, and exercises tailored to your specific needs. These recommendations are based on your survey responses and profile information. The resources cover various topics, including stress management, anxiety reduction, and overall mental health improvement.",
    },
    {
      question: "How is my privacy protected on Mentality?",
      answer:
        "Mentality takes privacy very seriously. All user data, including survey responses and communication with psychologists, is encrypted and stored securely. Only authorized professionals and system administrators have access to sensitive data, ensuring your confidentiality at all times.",
    },
    {
      question: "Can I cancel or reschedule an appointment?",
      answer:
        "Yes, you can cancel or reschedule an appointment through the app. Go to the 'Appointments' section, select the session you want to modify, and follow the prompts. Please note that cancellation or rescheduling policies might vary depending on the psychologist's terms.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-8">
      <h2 className="text-[hsl(var(--foreground))] font-semibold text-lg">
        Frequently Asked Questions
      </h2>

      <div className="flex flex-col gap-6">
        {faqs.map((faq, index) => (
          <div key={index} className="flex flex-col gap-2">
            <h3 className="text-[hsl(var(--foreground))] font-semibold text-base">
              {faq.question}
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] font-normal text-sm whitespace-pre-line">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;

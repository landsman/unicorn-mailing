<?php
declare(strict_types=1);

namespace Service\Mailgun;

use Mailgun\Mailgun;
use Mailgun\Model\Message\SendResponse;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class Sender
{
    public const SUCCESS_RESPONSE = 'Queued. Thank you.';

    private $key;
    private $domain;
    private $from;
    private $to;
    private $cc;
    private $bcc;
    private $reply_to;
    private $subject;
    private $attachment;
    private $template;
    private $inline;
    private $public_dir;
    private $variables;

    /** @var SendResponse */
    private $response = null;

    private function __construct(): void
    {
        $this->public_dir   = getenv('APP_PUBLIC_DIR');
        $this->key          = getenv('MAILGUN_API_KEY');
        $this->domain       = getenv('MAILGUN_DOMAIN');
        $this->from         = getenv('MAILGUN_FROM');
        $this->reply_to     = getenv('MAILGUN_REPLY_TO');
        $this->to           = null;
        $this->subject      = null;
        $this->template     = null;
        $this->attachment   = [];
        $this->inline       = [];
        $this->variables    = [];
    }

    public function addAttachment(string $path): self
    {
        if(!file_exists($path)){
            throw new \RuntimeException("Attachment: `{$path}` not exists!");
        }

        $this->attachment[] = ['filePath'=> $path, 'filename'=> basename($path)];
        return $this;
    }

    public function setVariables(array $vars): self
    {
        $this->variables = $vars;
        return $this;
    }


    /**
     * one image naming
     * @param $path
     * @return string
     */
    private static function inlineImageName($path): string
    {
        return pathinfo($path, PATHINFO_BASENAME);
    }

    /**
     * @param array $array
     * @return Sender
     */
    public function setInlineImages(array $array): self
    {
        $inline = [];
        foreach ($array as $path){
            $inline[] = [
                'filePath' => "{$this->public_dir}/{$path}",
                'filename' => self::inlineImageName($path),
            ];
        }

        $this->inline = $inline;
        return $this;
    }

    public function setReceiver(string $to): self
    {
        $this->to = $to;
        return $this;
    }

    public function getReceiver(): string
    {
        return $this->to;
    }

    public function setCc(string $email): self
    {
        $this->cc = $email;
        return $this;
    }

    public function getCc(): ?string
    {
        return $this->cc;
    }

    public function removeCc(): self
    {
        $this->cc = null;
        return $this;
    }

    public function setBcc(string $email): self
    {
        $this->bcc = $email;
        return $this;
    }

    public function getBcc(): ?string
    {
        return $this->bcc;
    }

    public function removeBcc(): self
    {
        $this->bcc = null;
        return $this;
    }

    public function setReplyTo(string $string): self
    {
        $this->reply_to = $string;
        return $this;
    }

    public function setSubject(string $txt): self
    {
        $this->subject = $txt;
        return $this;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function matchSuccessResponse(string $response_message): bool
    {
        $result = strpos(strtolower(self::SUCCESS_RESPONSE), strtolower($response_message)) !== false;
        if($result){
            return true;
        }

        return false;
    }

    public function sendEmail(): bool
    {
        if(null === $this->subject || strlen($this->subject) < 5){
            // @todo: console log of sender object
            throw new \RuntimeException('Subject should be defined!');
        }

        $mg = Mailgun::create($this->key);
        $params = [
            'from'              => $this->from,
            'to'                => $this->to,
            'subject'           => $this->subject,
            'template'          => $this->template,
            't:text'            => 'yes',
            'o:tracking'        => 'yes',
            'o:tracking-opens'  => 'yes',
            'o:dkim'            => 'yes',
            'h:Content-Type'    => 'multipart/related',
            'h:X-Mailgun-Variables' => $this->variables,
        ];

        if(null !== $this->cc)
        {
            $params['cc'] = $this->getCc();
        }

        if(null !== $this->bcc)
        {
            $params['bcc'] = $this->getBcc();
        }

        if(count($this->attachment) > 0)
        {
            $params['attachment'] = $this->attachment;
        }

        if(count($this->inline) > 0)
        {
            $params['inline'] = $this->inline;
        }

        if(!empty($this->reply_to))
        {
            $params['h:Reply-To'] = $this->reply_to;
        }

        /** @var SendResponse */
        $this->response = $mg->messages()->send($this->domain, $params);

        // clear our object for cycle using
        $this->setDefaultValues();

        return $this->matchSuccessResponse($this->response->getMessage());
    }

    public function getResponse(): SendResponse
    {
        return $this->response;
    }
}
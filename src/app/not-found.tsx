import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Página não encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            A página que você está procurando não existe.
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              Voltar ao início
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}